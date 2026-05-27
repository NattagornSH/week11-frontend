import { useState, useEffect } from "react";
import "./UsersManagement.css";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/users`
  : "http://localhost:3002/api/v2/users";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [section, setSection] = useState("user"); // "user" or "admin"
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "user",
    password: "",
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCurrentUser(result.data);
        }
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setUsers(result.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchUsers();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        credentials: "include",
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setCurrentUser(result.user);
        setLoginEmail("");
        setLoginPassword("");
      } else {
        alert(result.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login error");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setCurrentUser(null);
      setSection("user");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const [editingUserId, setEditingUserId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setFormData({
      username: user.username,
      email: user.email || "",
      role: user.role || "user",
      password: "", // empty so it won't update password unless they type
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setFormData({ username: "", email: "", role: "user", password: "" });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        // Update user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        const response = await fetch(`${API_BASE_URL}/${editingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        if (response.ok) {
          await fetchUsers();
          handleCancelEdit();
        } else {
          alert("Failed to update user");
        }
      } else {
        // Create user
        const response = await fetch(`${API_BASE_URL}/hash`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          await fetchUsers();
          handleCancelEdit();
        } else {
          alert("Failed to save user");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span>Home</span>
          <span>Owner</span>
        </div>
        <div className="navbar-right">
          {currentUser ? (
            <>
              <span>{currentUser.email}</span>
              <button className="btn-login" onClick={handleLogout} style={{backgroundColor: '#e74c3c'}}>Logout</button>
            </>
          ) : (
            <form onSubmit={handleLogin} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <input 
                type="text" 
                placeholder="apple@test.com" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input 
                type="password" 
                placeholder=".........." 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button type="submit" className="btn-login">Login</button>
              <button type="button" className="btn-signup">Sign up</button>
            </form>
          )}
        </div>
      </nav>

      <main className="main-content">
        <h1 className="title">
          Generation Thailand<br />React Assessment
        </h1>

        <div className="section-buttons">
          <button 
            className="btn-section btn-user-section"
            onClick={() => setSection("user")}
          >
            User Section
          </button>
          {currentUser && currentUser.role === "admin" && (
            <button 
              className="btn-section btn-admin-section"
              onClick={() => setSection("admin")}
            >
              Admin Section
            </button>
          )}
        </div>

        <div className="ai-card">
          <h3>Ask AI about users</h3>
          {!currentUser ? (
            <p>Please log in to use the AI feature</p>
          ) : (
            <div className="ai-input-group">
              <input type="text" placeholder="e.g. &quot;Who are the admins?&quot;" />
              <button className="btn-ask">Ask</button>
            </div>
          )}
        </div>

        {section === "admin" && (
          <form className="create-user-form" onSubmit={handleSaveUser}>
            <input 
              type="text" 
              name="username" 
              placeholder="Username" 
              value={formData.username}
              onChange={handleInputChange}
              required 
            />
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={formData.email}
              onChange={handleInputChange}
              required 
            />
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleInputChange}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <input 
              type="password" 
              name="password" 
              placeholder={editingUserId ? "Leave empty to keep current" : "Password"}
              value={formData.password}
              onChange={handleInputChange}
              required={!editingUserId}
            />
            <button type="submit" className="btn-save">
              {editingUserId ? "Update User" : "Save new user"}
            </button>
            {editingUserId && (
              <button type="button" className="btn-save" onClick={handleCancelEdit} style={{backgroundColor: '#95a5a6'}}>
                Cancel
              </button>
            )}
          </form>
        )}

        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                {section === "admin" && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email || "-"}</td>
                  <td>{user.role}</td>
                  {section === "admin" && (
                    <td className="actions">
                      <button className="btn-edit" onClick={() => handleEditClick(user)}>Edit</button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={section === "admin" ? 4 : 3} style={{textAlign: "center"}}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default UsersManagement;
