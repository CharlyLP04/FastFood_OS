import React, { useState, useEffect } from 'react';
import { Icon, ICONS } from '../components/ui/Icon';
import { Toast } from '../components/ui/Toast';
import { getConfiguraciones, updateConfiguraciones } from '../services/api';

export default function Configuracion() {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState('MXN');
  const [taxRate, setTaxRate] = useState('16');
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const data = await getConfiguraciones();
      setConfig(data);
      
      // Initialize states from DB
      if (data.restaurant_name) setRestaurantName(data.restaurant_name.valor);
      if (data.currency) setCurrency(data.currency.valor);
      if (data.tax_rate) setTaxRate(data.tax_rate.valor);
      if (data.auto_print) setAutoPrint(data.auto_print.valor === 'true');
      
    } catch (error) {
      showToast('Error al cargar la configuración.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        restaurant_name: restaurantName,
        currency: currency,
        tax_rate: taxRate,
        auto_print: autoPrint.toString()
      };
      await updateConfiguraciones(payload);
      showToast('Configuración guardada exitosamente.', 'success');
    } catch (error) {
      showToast(error.message || 'Error al guardar la configuración.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <main className="flex-1 bg-[#0A0A0B] overflow-y-auto">
        <div className="p-8 pb-32">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Icon path={ICONS.settings} size={28} className="text-[#E8530A]" />
                Configuración General
              </h1>
              <p className="text-neutral-400 text-sm mt-1 font-bold">
                Ajusta las variables principales de FastFood OS.
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isLoading}
              className="bg-[#E8530A] hover:bg-[#ff6214] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(232,83,10,0.3)] flex items-center gap-2 cursor-pointer"
            >
              <Icon path={ICONS.save} size={18} />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20 text-neutral-500 font-bold gap-3">
              <Icon path={ICONS.refresh} size={24} className="animate-spin" />
              Cargando preferencias...
            </div>
          ) : (
            <div className="max-w-3xl">
              <div className="bg-[#141416] border border-[#1F1F23] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8530A]/5 blur-[100px] rounded-full pointer-events-none"></div>
                
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                  Datos del Negocio
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Nombre del Restaurante */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">
                      Nombre del Restaurante
                    </label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#1F1F23] focus:border-[#E8530A] focus:ring-1 focus:ring-[#E8530A] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-600 font-bold"
                      placeholder="Ej. FastFood"
                    />
                    <p className="text-[10px] text-neutral-500 font-bold pl-1 uppercase">
                      Este nombre aparecerá en los tickets.
                    </p>
                  </div>

                  {/* Moneda */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">
                      Moneda Principal
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#1F1F23] focus:border-[#E8530A] focus:ring-1 focus:ring-[#E8530A] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="MXN">Peso Mexicano (MXN)</option>
                      <option value="USD">Dólar Estadounidense (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="COP">Peso Colombiano (COP)</option>
                    </select>
                  </div>
                </div>

                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                  Operación y Ventas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Tasa de Impuesto */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">
                      Tasa de Impuesto (IVA %)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#1F1F23] focus:border-[#E8530A] focus:ring-1 focus:ring-[#E8530A] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-600 font-bold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-black">%</span>
                    </div>
                  </div>

                  {/* Impresión automática */}
                  <div className="flex flex-col gap-2 justify-center">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1 mb-1">
                      Impresión de Tickets
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={autoPrint}
                          onChange={(e) => setAutoPrint(e.target.checked)}
                        />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${autoPrint ? 'bg-[#E8530A]' : 'bg-[#27272A]'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoPrint ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                      <span className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors">
                        Imprimir ticket automáticamente al cobrar
                      </span>
                    </label>
                  </div>
                </div>
                
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}
