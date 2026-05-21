import { useState, useEffect } from "react";
import "./UsersManagement.css";

const API_BASE_URL = "http://localhost:3002/api/v2/users";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const result = await response.json();
      setUsers(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create new user with bcrypt hash
  const createUser = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/hash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "ไม่สามารถสร้างผู้ใช้ได้",
        );
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async (id, userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถอัพเดทผู้ใช้ได้");
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?")) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถลบผู้ใช้ได้");
      }

      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      // Update - don't send password if empty
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      updateUser(editingUser._id, updateData);
    } else {
      // Create
      createUser(formData);
    }
  };

  // Open modal for create
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ username: "", email: "", password: "", role: "user" });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || "",
      password: "",
      role: user.role || "user",
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ username: "", email: "", password: "", role: "user" });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="users-management">
      <div className="header">
        <h1>จัดการผู้ใช้งาน (MongoDB + Bcrypt)</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading && <div className="loading">กำลังโหลด...</div>}

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อผู้ใช้</th>
              <th>อีเมล</th>
              <th>บทบาท</th>
              <th>วันที่สร้าง</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  ไม่มีข้อมูลผู้ใช้
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td className="id-cell" title={user._id}>
                    {user._id.substring(0, 8)}...
                  </td>
                  <td>{user.username}</td>
                  <td>{user.email || "-"}</td>
                  <td>
                    <span className={`badge badge-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("th-TH")
                      : "-"}
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-edit"
                      onClick={() => openEditModal(user)}
                      disabled={loading}
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      className="btn btn-delete"
                      onClick={() => deleteUser(user._id)}
                      disabled={loading}
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">ชื่อผู้ใช้ *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="กรอกชื่อผู้ใช้"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">อีเมล *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="กรอกอีเมล"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  รหัสผ่าน{" "}
                  {editingUser ? "(เว้นว่างถ้าไม่ต้องการเปลี่ยน)" : "*"}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength={8}
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">บทบาท *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? "กำลังบันทึก..."
                    : editingUser
                      ? "บันทึกการแก้ไข"
                      : "สร้างผู้ใช้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagement;
