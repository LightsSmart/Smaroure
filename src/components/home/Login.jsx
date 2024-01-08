import React, { useState } from "react";
import styles from "./Login.module.css";

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    function handleSubmit(event) {
        event.preventDefault();
    }

    return (
        <div className={styles.container}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Login</h2>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
              />
            </div>
            <button type="submit" className={styles.button}>Login</button>
          </form>
        </div>
    );
}

export default Login;
