const API_URL = "https://your-api-domain.com"; 

async function login(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("token", data.token);
    window.location.href = "welcome.html";
  } else {
    document.getElementById("error").innerText = data.message;
  }
}

async function signup(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const email = document.getElementById("email").value;

  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Signup successful. Please log in.");
    window.location.href = "index.html";
  } else {
    document.getElementById("error").innerText = data.message;
  }
}

function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "index.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
