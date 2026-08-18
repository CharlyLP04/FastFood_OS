import React, { useState, useEffect } from 'react';
import { Icon, ICONS } from '../components/ui/Icon';
import { Toast } from '../components/ui/Toast';
import { getUsuarios, getRoles, createUsuario, updateUsuario, toggleUsuarioStatus, deleteUsuario } from '../services/api';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [usersData, rolesData] = await Promise.all([
        getUsuarios(),
        getRoles()
      ]);
      setUsuarios(usersData);
      setRoles(rolesData);
    } catch (error) {
      showToast('Error al cargar los usuarios o roles.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setNombre('');
    setApellido('');
    setUsername('');
    setPassword('');
    setRolId('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setNombre(user.nombre);
    setApellido(user.apellido);
    setUsername(user.username);
    setPassword('');
    setRolId(user.rol_id);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    try {
      const response = await toggleUsuarioStatus(user.id);
      showToast(response.mensaje, 'success');
      fetchInitialData();
    } catch (error) {
      showToast(error.message || 'Error al cambiar estado.', 'warning');
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUsuario(userToDelete.id);
      showToast('Empleado eliminado permanentemente.', 'success');
      fetchInitialData();
    } catch (error) {
      showToast(error.message || 'Error al eliminar el usuario.', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingUser) {
        await updateUsuario(editingUser.id, {
          nombre,
          apellido,
          username,
          rol_id: parseInt(rolId, 10),
          password: password || undefined
        });
        showToast('Empleado actualizado correctamente.', 'success');
      } else {
        await createUsuario({
          nombre,
          apellido,
          username,
          rol_id: parseInt(rolId, 10),
          password
        });
        showToast('Empleado creado correctamente.', 'success');
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (error) {
      showToast(error.message || 'Error al guardar el usuario.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (user) => {
    const n = (user.nombre || '').charAt(0);
    const a = (user.apellido || '').charAt(0);
    return `${n}${a}`.toUpperCase() || 'U';
  };

  return (
    <>
      <main className="flex-1 bg-[#0A0A0B] overflow-y-auto font-body animate-fade-in">
        <div className="max-w-7xl mx-auto pb-20">
          
          {/* Header de la sección */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[#242428] pb-6">
            <div>
              <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Icon path={ICONS.users} size={30} className="text-[#E85D2F]" />
                Gestión de Empleados
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-medium">
                Administra permisos, accesos y roles de tu personal.
              </p>
            </div>
            
            <button
              onClick={openCreateModal}
              className="bg-[#E85D2F] hover:bg-[#d64e21] text-white px-5 py-3 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Icon path={ICONS.plus} size={18} />
              Nuevo Empleado
            </button>
          </div>

          {/* Tabla de Empleados */}
          <div className="bg-[#141416] border border-[#242428] rounded-xl overflow-hidden shadow-xl relative">
            {isLoading ? (
              <div className="p-12 text-center text-zinc-400 font-bold flex flex-col items-center justify-center gap-3">
                <Icon path={ICONS.refresh} size={28} className="animate-spin text-[#E85D2F]" />
                Cargando empleados...
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 font-bold text-sm">
                No hay empleados registrados en el sistema.
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1C1C20] text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-[#242428]">
                      <th className="px-6 py-4 rounded-tl-xl">Empleado</th>
                      <th className="px-6 py-4">Rol</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right rounded-tr-xl">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium divide-y divide-[#242428]">
                    {usuarios.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                        
                        {/* Integración del Ícono de Usuario */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E85D2F] to-[#DC2626] border border-white/20 text-white font-heading font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                              {getInitials(user)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{user.nombre} {user.apellido}</p>
                              <p className="text-xs text-zinc-400 font-medium">@{user.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Rol */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E85D2F]/15 text-[#E85D2F] border border-[#E85D2F]/30">
                            {user.rol}
                          </span>
                        </td>

                        {/* Estado con Resaltado de Problema/Activo */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            user.activo 
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' 
                              : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${user.activo ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`}></span>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          {user.id !== 1 && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 text-zinc-400 hover:text-white bg-[#1C1C20] hover:bg-white/10 rounded-lg transition-colors cursor-pointer active:scale-95"
                                title="Editar empleado"
                              >
                                <Icon path={ICONS.edit} size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className={`p-2 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                                  user.activo 
                                    ? 'text-[#F59E0B] hover:bg-[#F59E0B]/20 bg-[#1C1C20]' 
                                    : 'text-[#10B981] hover:bg-[#10B981]/20 bg-[#1C1C20]'
                                }`}
                                title={user.activo ? 'Desactivar acceso al sistema' : 'Activar acceso al sistema'}
                              >
                                <Icon path={ICONS.power} size={16} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(user)}
                                className="p-2 text-[#EF4444] hover:bg-[#EF4444]/20 bg-[#1C1C20] rounded-lg transition-colors cursor-pointer active:scale-95"
                                title="Eliminar empleado"
                              >
                                <Icon path={ICONS.trash} size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Editar/Crear Empleado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#141416] border border-[#242428] rounded-xl shadow-2xl overflow-hidden animate-pop-in">
            <div className="p-6 border-b border-[#242428] flex items-center justify-between">
              <h2 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                {editingUser ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white text-xs uppercase font-bold">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-1 focus:ring-[#E85D2F] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 font-medium"
                    placeholder="Ej. Juan"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Apellido</label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-1 focus:ring-[#E85D2F] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 font-medium"
                    placeholder="Ej. Pérez"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Usuario (Username)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-1 focus:ring-[#E85D2F] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 font-medium"
                  placeholder="Ej. jperez"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Contraseña {editingUser && '(Dejar en blanco para no cambiar)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-1 focus:ring-[#E85D2F] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 font-medium"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Rol de Sistema</label>
                <select
                  required
                  value={rolId}
                  onChange={(e) => setRolId(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-1 focus:ring-[#E85D2F] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium cursor-pointer"
                >
                  <option value="">Selecciona un rol...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre.toUpperCase()} - {r.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-[#242428]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#E85D2F] hover:bg-[#d64e21] text-white px-6 py-2.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="¿Eliminar permanentemente?"
        message={`Estás a punto de eliminar al empleado "${userToDelete?.nombre} ${userToDelete?.apellido}". Esta acción es irreversible.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
      />
    </>
  );
}
