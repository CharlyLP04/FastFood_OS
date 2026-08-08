const pool = require('../config/db');
const { manejarErrorInterno } = require('../utils/errorHandler');

const getMetrics = async (req, res) => {
  try {
    const { period = 'hoy' } = req.query;

    let dateCondition = "created_at >= CURRENT_DATE";
    let prevDateCondition = "created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE";

    if (period === '7dias') {
      dateCondition = "created_at >= NOW() - INTERVAL '7 days'";
      prevDateCondition = "created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'";
    } else if (period === '30dias') {
      dateCondition = "created_at >= NOW() - INTERVAL '30 days'";
      prevDateCondition = "created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'";
    }

    // 1. Ventas del Periodo
    const ventasResult = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total_ventas, COUNT(*) as total_pedidos 
      FROM pedidos 
      WHERE ${dateCondition} AND estado != 'cancelado'
    `);
    const ventas = parseFloat(ventasResult.rows[0]?.total_ventas || 0);
    const totalPedidosPeriodo = parseInt(ventasResult.rows[0]?.total_pedidos || 0, 10);

    // 2. Ventas Periodo Anterior (para % de crecimiento)
    const ventasPrevResult = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total_prev 
      FROM pedidos 
      WHERE ${prevDateCondition} AND estado != 'cancelado'
    `);
    const ventasPrev = parseFloat(ventasPrevResult.rows[0]?.total_prev || 0);

    let crecimientoVentas = 0;
    if (ventasPrev > 0) {
      crecimientoVentas = ((ventas - ventasPrev) / ventasPrev) * 100;
    } else if (ventas > 0) {
      crecimientoVentas = 100;
    }

    // 3. Pedidos Activos (en cocina o por cobrar)
    const activosResult = await pool.query(`
      SELECT COUNT(*) as activos 
      FROM pedidos 
      WHERE estado IN ('nuevo', 'pendiente', 'en_preparacion', 'preparando', 'listo')
    `);
    const pedidosActivos = parseInt(activosResult.rows[0]?.activos || 0, 10);

    // 4. Ticket Promedio
    const ticketResult = await pool.query(`
      SELECT COALESCE(AVG(total), 0) as promedio 
      FROM pedidos 
      WHERE ${dateCondition} AND estado != 'cancelado'
    `);
    const ticketPromedio = parseFloat(ticketResult.rows[0]?.promedio || 0);

    // 5. Tendencia de Ventas (para la gráfica)
    let trendData = [];
    try {
      if (period === 'hoy') {
        const trendResult = await pool.query(`
          SELECT 
            TO_CHAR(created_at, 'HH24:00') as label,
            COALESCE(SUM(total), 0) as ventas,
            COUNT(*) as ordenes
          FROM pedidos
          WHERE ${dateCondition} AND estado != 'cancelado'
          GROUP BY TO_CHAR(created_at, 'HH24:00')
          ORDER BY label ASC
        `);
        trendData = trendResult.rows.map(r => ({
          label: r.label,
          ventas: parseFloat(r.ventas || 0),
          ordenes: parseInt(r.ordenes || 0, 10)
        }));
      } else {
        const trendResult = await pool.query(`
          SELECT 
            TO_CHAR(created_at, 'DD/MM') as label,
            COALESCE(SUM(total), 0) as ventas,
            COUNT(*) as ordenes
          FROM pedidos
          WHERE ${dateCondition} AND estado != 'cancelado'
          GROUP BY TO_CHAR(created_at, 'DD/MM'), DATE(created_at)
          ORDER BY DATE(created_at) ASC
        `);
        trendData = trendResult.rows.map(r => ({
          label: r.label,
          ventas: parseFloat(r.ventas || 0),
          ordenes: parseInt(r.ordenes || 0, 10)
        }));
      }
    } catch (trendErr) {
      console.warn('Advertencia en query de tendencia:', trendErr.message);
    }

    if (!Array.isArray(trendData) || trendData.length === 0) {
      trendData = [
        { label: '09:00', ventas: 0, ordenes: 0 },
        { label: '12:00', ventas: 0, ordenes: 0 },
        { label: '15:00', ventas: 0, ordenes: 0 },
        { label: '18:00', ventas: 0, ordenes: 0 },
        { label: '21:00', ventas: 0, ordenes: 0 },
      ];
    }

    // 6. Top 5 Productos Más Vendidos
    let topProductos = [];
    try {
      const topProdResult = await pool.query(`
        SELECT 
          p.id, p.nombre, c.nombre AS categoria,
          SUM(dp.cantidad) AS unidades_vendidas,
          SUM(dp.cantidad * dp.precio_unitario) AS total_recaudado
        FROM detalles_pedido dp
        INNER JOIN pedidos ped ON ped.id = dp.pedido_id
        INNER JOIN productos p ON p.id = dp.producto_id
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE ${dateCondition.replace(/created_at/g, 'ped.created_at')} AND ped.estado != 'cancelado'
        GROUP BY p.id, p.nombre, c.nombre
        ORDER BY unidades_vendidas DESC
        LIMIT 5
      `);

      topProductos = topProdResult.rows.map(r => ({
        id: r.id,
        nombre: r.nombre,
        categoria: r.categoria || 'General',
        unidades: parseInt(r.unidades_vendidas || 0, 10),
        recaudado: parseFloat(r.total_recaudado || 0)
      }));
    } catch (topErr) {
      console.warn('Advertencia en query de top productos:', topErr.message);
    }

    // 7. Últimos Pedidos Recientes
    let ultimosPedidos = [];
    try {
      const ultimosResult = await pool.query(`
        SELECT p.id, p.total, p.estado, p.created_at, p.mesa_numero, u.nombre as mesero
        FROM pedidos p
        LEFT JOIN usuarios u ON p.mesero_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 6
      `);
      ultimosPedidos = ultimosResult.rows.map(p => ({
        ...p,
        total: parseFloat(p.total || 0)
      }));
    } catch (ultErr) {
      console.warn('Advertencia en query de últimos pedidos:', ultErr.message);
    }

    return res.status(200).json({
      period,
      ventasDelDia: ventas,
      totalPedidosPeriodo,
      crecimientoVentas,
      ventasAyer: ventasPrev,
      pedidosActivos,
      ticketPromedio,
      trendData,
      topProductos,
      ultimosPedidos
    });

  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    return res.status(200).json({
      period: req.query?.period || 'hoy',
      ventasDelDia: 0,
      totalPedidosPeriodo: 0,
      crecimientoVentas: 0,
      ventasAyer: 0,
      pedidosActivos: 0,
      ticketPromedio: 0,
      trendData: [
        { label: '09:00', ventas: 0, ordenes: 0 },
        { label: '12:00', ventas: 0, ordenes: 0 },
        { label: '15:00', ventas: 0, ordenes: 0 },
        { label: '18:00', ventas: 0, ordenes: 0 },
        { label: '21:00', ventas: 0, ordenes: 0 },
      ],
      topProductos: [],
      ultimosPedidos: []
    });
  }
};

module.exports = {
  getMetrics
};
