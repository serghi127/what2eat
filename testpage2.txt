"use client";

import React, { useEffect, useState } from "react";
import "./styles/userpage.css";
import RedirectButton from "./components/Button";
import { Routes, Route } from 'react-router-dom';
import Link from "next/link";


type User = {
  id: number;
  name: string;
  email: string;
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data: User[]) => setUsers(data))
      .finally(() => setLoading(false));
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    // POST request to API
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (res.ok) {
      const newUser: User = await res.json();
      setUsers([...users, newUser]);
      setName("");
      setEmail("");
    }
  };

  if (loading) {
    return <p className="loading-text">Loading users...</p>;
  }

  return (
    <div className="container">
      <h1 className="title">Users</h1>

      <form className="user-form" onSubmit={handleAddUser}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Add User</button>
        <RedirectButton title="Login" target = "app/homepage/page"/>
        <li><Link href="/homepage">Home</Link></li>

      </form>

      <ul className="user-list">
        {users.map((user) => (
          <li key={user.id} className="user-item">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersPage;
