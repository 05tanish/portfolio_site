// admin token state
let authToken = '';

const loginOverlay = document.getElementById('login-overlay');
const mainDash = document.getElementById('main-dash');
const authForm = document.getElementById('auth-form');

// Elements
const messagesList = document.getElementById('messages-list');
const projectsList = document.getElementById('projects-list');
const blogsList = document.getElementById('blogs-list');

// Auth Handle
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const tokenInput = document.getElementById('admin-token').value;
    authToken = `Bearer ${tokenInput}`;

    // Basic test by fetching messages
    fetchData();
});

function logout() {
    authToken = '';
    mainDash.style.display = 'none';
    loginOverlay.style.display = 'flex';
    document.getElementById('admin-token').value = '';
}

// Fetch all Data
async function fetchData() {
    try {
        // Fetch Messages (Requires auth immediately)
        const msgRes = await fetch('/api/contact', {
            headers: { 'Authorization': authToken }
        });

        if (msgRes.status === 401) {
            alert('Invalid Admin Token');
            return;
        }

        const msgData = await msgRes.json();
        renderMessages(msgData.messages || []);

        // If auth passed, reveal dashboard
        loginOverlay.style.display = 'none';
        mainDash.style.display = 'block';

        // Fetch Projects
        const projRes = await fetch('/api/projects');
        const projData = await projRes.json();
        renderProjects(projData.projects || []);

        // Fetch Blogs
        const blogRes = await fetch('/api/blogs');
        const blogData = await blogRes.json();
        renderBlogs(blogData.blogs || []);

    } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        alert("Connection to backend failed.");
    }
}

// Render functions
function renderMessages(messages) {
    if (messages.length === 0) {
        messagesList.innerHTML = '<li class="data-item text-tertiary">No messages found.</li>';
        return;
    }

    messagesList.innerHTML = messages.map(msg => `
        <li class="data-item">
            <strong>${msg.name} (${msg.email}) - ${new Date(msg.created_at).toLocaleDateString()}</strong>
            <p style="margin-top: 4px;">${msg.message}</p>
        </li>
    `).join('');
}

function renderProjects(projects) {
    if (projects.length === 0) {
        projectsList.innerHTML = '<li class="data-item text-tertiary">No active projects found in DB.</li>';
        return;
    }

    projectsList.innerHTML = projects.map(p => `
        <li class="data-item" style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <strong>${p.title} <span class="mono text-small" style="color:var(--accent-primary)">[${p.language || 'N/A'}]</span></strong>
                <p style="margin-top: 4px; font-size: 0.85rem;">${p.description}</p>
            </div>
            <button class="delete-btn" onclick="deleteItem('projects', ${p.id})">Delete</button>
        </li>
    `).join('');
}

function renderBlogs(blogs) {
    if (blogs.length === 0) {
        blogsList.innerHTML = '<li class="data-item text-tertiary">No blog logs found in DB.</li>';
        return;
    }

    blogsList.innerHTML = blogs.map(b => `
        <li class="data-item" style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <strong>${new Date(b.date).toLocaleDateString()} - ${b.title}</strong>
                <p style="margin-top: 4px; font-size: 0.85rem;">${b.content.substring(0, 50)}...</p>
            </div>
            <button class="delete-btn" onclick="deleteItem('blogs', ${b.id})">Delete</button>
        </li>
    `).join('');
}

// Create new Blog
document.getElementById('add-blog-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('b-title').value;
    const date = document.getElementById('b-date').value;
    const content = document.getElementById('b-content').value;

    try {
        const res = await fetch('/api/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
            body: JSON.stringify({ title, date, content })
        });
        if (res.ok) {
            e.target.reset();
            fetchData(); // refresh list
        } else {
            alert('Failed to post block.');
        }
    } catch (err) {
        console.error(err);
    }
});

// Create new Project
document.getElementById('add-project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('p-title').value;
    const language = document.getElementById('p-lang').value;
    const description = document.getElementById('p-desc').value;

    try {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
            body: JSON.stringify({ title, language, description, images: [] }) // Empty images array for basic dashboard upload initially
        });
        if (res.ok) {
            e.target.reset();
            fetchData(); // refresh list
        } else {
            alert('Failed to add project.');
        }
    } catch (err) {
        console.error(err);
    }
});

// Delete generic item
async function deleteItem(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type} item?`)) return;

    try {
        const res = await fetch(`/api/${type}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            fetchData(); // refresh
        } else {
            alert('Failed to delete.');
        }
    } catch (err) {
        console.error(err);
    }
}
