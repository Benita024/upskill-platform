document.addEventListener("DOMContentLoaded", async function () {

    console.log("✅ Script loaded");

    const user = JSON.parse(localStorage.getItem("user"));

    const isLoginPage = document.getElementById("loginForm");

    if (!isLoginPage) {
        if (!user) {
            window.location.href = "auth.html";
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:5000/get-user/${user.email}`);
            const freshUser = await res.json();

            localStorage.setItem("user", JSON.stringify(freshUser));

            updateNavbar(freshUser);
            initNavbarDropdown();
            initLogout();

        } catch (err) {
            console.error("Auth error:", err);
            window.location.href = "auth.html";
            return;
        }
    }

    if (document.getElementById("profileName")) {
    initProfilePage();
}
if (document.getElementById("statOffering")) {
    initDashboardPage();
}

    if (document.getElementById("searchInput")) {
        initBrowsePage();
    }

    if (document.getElementById("receivedRequestsList")) {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        await loadRequestsPage(currentUser);
    }
    if (document.getElementById("profileName")) {
        initProfilePage();
    }
    const addModal = document.getElementById("addSkillModal");

    if (addModal) {
        addModal.addEventListener("click", function (e) {
            if (e.target === addModal) {
                closeAddSkillModal();
            }
        });
    }

    // bio modal 
    const bioModal = document.getElementById("editBioModal");
    if (bioModal) {
        bioModal.addEventListener("click", function (e) {
            if (e.target === bioModal) {
                closeEditBioModal();
            }
        });
    }

    // email Modal 
    const emailModal = document.getElementById("updateEmailModal");
    if (emailModal) {
        emailModal.addEventListener("click", function (e) {
            if (e.target === emailModal) {
                closeEmailModal();
            }
        });
    }
});

function updateNavbar(user) {
    const initials = user.name
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase();

    const navCredits = document.getElementById("navCredits");
    if (navCredits) navCredits.innerText = user.credits;

    const bigCredits = document.getElementById("bigCredits");
    if (bigCredits) bigCredits.innerText = `${user.credits} Credits`;

    const avatarInitials = document.getElementById("avatarInitials");
    if (avatarInitials) avatarInitials.innerText = initials;

    const dropdownInitials = document.getElementById("dropdownInitials");
    if (dropdownInitials) dropdownInitials.innerText = initials;

    const dropdownName = document.getElementById("dropdownName");
    if (dropdownName) dropdownName.innerText = user.name;

    const identitySkills = document.querySelector(".identity-skills");

    if (identitySkills && user.skills_offered) {
        identitySkills.innerHTML = "";

        user.skills_offered.slice(0, 2).forEach((skill, index) => {
            if (index > 0) {
                identitySkills.innerHTML += "<span>•</span>";
            }
            identitySkills.innerHTML += `<span>${skill.name}</span>`;
        });
    }

    const navName = document.getElementById("navName");
    if (navName) navName.innerText = user.name;

    const welcomeName = document.getElementById("welcomeName");
    if (welcomeName) welcomeName.innerText = `Welcome back, ${user.name}!`;
}

async function initDashboardPage() {

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    //  Skills counts
    const offeringCount = user.skills_offered?.length || 0;
    const learningCount = user.skills_wanted?.length || 0;

    const offeringEl = document.getElementById("statOffering");
    const learningEl = document.getElementById("statLearning");

    if (offeringEl) offeringEl.innerText = offeringCount;
    if (learningEl) learningEl.innerText = learningCount;

    try {
        //  Request counts
        const res = await fetch(`http://127.0.0.1:5000/my-requests/${user.email}`);
        const data = await res.json();

        const sentEl = document.getElementById("statSent");
        const receivedEl = document.getElementById("statReceived");

        if (sentEl) sentEl.innerText = data.sent.length;
        if (receivedEl) receivedEl.innerText = data.received.length;

    } catch (err) {
        console.error("Dashboard stats error:", err);
    }
}

async function loadRequestsPage(user) {

    console.log("📦 Loading requests...");

    try {
        const response = await fetch(`http://127.0.0.1:5000/my-requests/${user.email}`);
        const data = await response.json();

        const receivedContainer = document.getElementById("receivedRequestsList");
        const sentContainer = document.getElementById("sentRequestsList");

        const receivedEmpty = document.getElementById("receivedEmpty");
        const sentEmpty = document.getElementById("sentEmpty");

        receivedContainer.innerHTML = "";
        sentContainer.innerHTML = "";

        data.received.forEach(req => {
            const card = document.createElement("div");
            card.className = "request-card received";

            card.innerHTML = `
                <div class="card-header">
                    <div class="avatar-small">
                    ${req.from_name ? req.from_name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div class="card-info">
                        <h3 class="user-name">${req.from_name}</h3>
                        <span class="skill-chip">
                        <i class="fas fa-book"></i>
                        ${req.skill}
                        </span>
                    </div>
                </div>
                <div class="card-status">
                    <span class="status-badge ${req.status}">
                        ${req.status}
                    </span>
                </div>
                ${req.status === "pending" ? `
    <div class="card-actions">
        <button class="btn-accept" data-id="${req.id}">
            Accept
        </button>
        <button class="btn-reject" data-id="${req.id}">
            Reject
        </button>
    </div>
` : ""}
            `;

            receivedContainer.appendChild(card);
        });

        data.sent.forEach(req => {
            const card = document.createElement("div");
            card.className = "request-card sent";

            card.innerHTML = `
                <div class="card-header">
                    <div class="avatar-small">${req.to_name ? req.to_name.charAt(0).toUpperCase() : "?"}</div>
                    <div class="card-info">
                        <h3>${req.to_name}</h3>
                        <span class="skill-chip">${req.skill}</span>
                    </div>
                </div>
                <div class="card-status">
                    <span class="status-badge ${req.status}">
                        ${req.status}
                    </span>
                </div>
            `;

            sentContainer.appendChild(card);
        });

        if (receivedEmpty)
            receivedEmpty.style.display =
                data.received.length === 0 ? "block" : "none";

        if (sentEmpty)
            sentEmpty.style.display =
                data.sent.length === 0 ? "block" : "none";

        const badges = document.querySelectorAll(".column-badge");
        if (badges.length === 2) {
            badges[0].textContent = data.received.length;
            badges[1].textContent = data.sent.length;
        }

        document.querySelectorAll(".btn-accept").forEach(btn => {
    btn.addEventListener("click", async function () {

        const requestId = this.dataset.id;
        const button = this;
        const currentUser = JSON.parse(localStorage.getItem("user"));

        button.disabled = true;
        button.innerText = "Accepting...";

        try {
            const res = await fetch("http://127.0.0.1:5000/accept-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request_id: requestId,
                    current_user_id: currentUser.id
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error);
                button.disabled = false;
                button.innerText = "Accept";
                return;
            }

            const card = button.closest(".request-card");
            const badge = card.querySelector(".status-badge");

            badge.className = "status-badge accepted";
            badge.innerText = "accepted";

            const actions = card.querySelector(".card-actions");
            if (actions) actions.remove();

            // 🔄 Refresh credits
            const updatedUserRes = await fetch(`http://127.0.0.1:5000/get-user/${currentUser.email}`);
            const updatedUser = await updatedUserRes.json();
            localStorage.setItem("user", JSON.stringify(updatedUser));
            updateNavbar(updatedUser);

        } catch (err) {
            console.error(err);
            button.disabled = false;
            button.innerText = "Accept";
        }
    });
});

        document.querySelectorAll(".btn-reject").forEach(btn => {
    btn.addEventListener("click", async function () {

        const requestId = this.dataset.id;
        const button = this;
        const currentUser = JSON.parse(localStorage.getItem("user"));

        button.disabled = true;
        button.innerText = "Rejecting...";

        try {
            const res = await fetch("http://127.0.0.1:5000/reject-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request_id: requestId,
                    current_user_id: currentUser.id
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error);
                button.disabled = false;
                button.innerText = "Reject";
                return;
            }

            const card = button.closest(".request-card");
            const badge = card.querySelector(".status-badge");

            badge.className = "status-badge rejected";
            badge.innerText = "rejected";

            const actions = card.querySelector(".card-actions");
            if (actions) actions.remove();

            // 🔄 Refresh credits
            const updatedUserRes = await fetch(`http://127.0.0.1:5000/get-user/${currentUser.email}`);
            const updatedUser = await updatedUserRes.json();
            localStorage.setItem("user", JSON.stringify(updatedUser));
            updateNavbar(updatedUser);

        } catch (err) {
            console.error(err);
            button.disabled = false;
            button.innerText = "Reject";
        }
    });
});

        console.log("✅ Requests loaded");

    } catch (err) {
        console.error("Request page error:", err);
    }

}

// ====== BROWSE PAGE SEARCH & FILTER ======
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const teachersTableBody = document.getElementById('teachersTableBody');
const teachersCount = document.getElementById('teachersCount');
const emptyState = document.getElementById('emptyState');
const activeFilters = document.getElementById('activeFilters');

function filterTeachers() {
    if (!teachersTableBody) return;

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const category = categorySelect?.value || 'all';
    const sortBy = sortSelect?.value || 'name';

    const rows = Array.from(teachersTableBody.querySelectorAll('tr'));
    let visibleCount = 0;

    rows.forEach(row => {
        const name = row.dataset.name || '';
        const skill = row.dataset.skill || '';
        const rowCategory = row.dataset.category || '';

        const matchesSearch = searchTerm === '' ||
            name.includes(searchTerm) ||
            skill.includes(searchTerm);

        const matchesCategory = category === 'all' || rowCategory === category;

        if (matchesSearch && matchesCategory) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Sort rows
    if (sortBy === 'credits') {
        rows.sort((a, b) => {
            const creditsA = parseInt(a.querySelector('.credit-badge')?.innerText.match(/\d+/) || 0);
            const creditsB = parseInt(b.querySelector('.credit-badge')?.innerText.match(/\d+/) || 0);
            return creditsA - creditsB;
        });

        rows.forEach(row => {
            if (row.style.display !== 'none') {
                teachersTableBody.appendChild(row);
            }
        });
    }

    // Update count and empty state
    teachersCount.textContent = visibleCount;

    if (visibleCount === 0) {
        emptyState.style.display = 'block';
        teachersTableBody.parentElement.parentElement.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        teachersTableBody.parentElement.parentElement.style.display = 'block';
    }

    // Show active filters
    let filterText = [];
    if (searchTerm) filterText.push(`"${searchTerm}"`);
    if (category !== 'all') filterText.push(category);

    if (filterText.length > 0) {
        activeFilters.innerHTML = `<span class="filter-chip">Filtering: ${filterText.join(' · ')}</span>`;
    } else {
        activeFilters.innerHTML = '';
    }
}

// Event listeners
if (searchInput) {
    searchInput.addEventListener('input', filterTeachers);
}

if (categorySelect) {
    categorySelect.addEventListener('change', filterTeachers);
}

if (sortSelect) {
    sortSelect.addEventListener('change', filterTeachers);
}

// Clear filters
function clearFilters() {
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = 'all';
    if (sortSelect) sortSelect.value = 'name';
    filterTeachers();
}

// Initialize
filterTeachers();

function initNavbarDropdown() {

    const dropdown = document.getElementById("profileDropdown");
    const avatarBtn = document.getElementById("avatarBtn");

    if (!dropdown || !avatarBtn) return;

    avatarBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        dropdown.classList.toggle("active");
    });

    document.addEventListener("click", function (e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });
}
function initLogout() {
    // Smooth logout: show overlay, call backend, clear local state, then redirect
    function performLogout() {
        let overlay = document.getElementById('logoutOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'logoutOverlay';
            Object.assign(overlay.style, {
                position: 'fixed',
                inset: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.95)',
                color: '#111827',
                zIndex: '9999',
                opacity: '0',
                transition: 'opacity 320ms ease'
            });
            overlay.innerHTML = '<div style="text-align:center;font-family:inherit;"><div style="font-size:1.25rem;margin-bottom:0.5rem;">Logging out…</div><div style="width:36px;height:36px;border-radius:50%;border:4px solid rgba(0,0,0,0.08);border-top-color:#7C3AED;animation:spin 1s linear infinite"></div></div>';
            document.body.appendChild(overlay);
            const styleEl = document.createElement('style');
            styleEl.innerHTML = '@keyframes spin{to{transform:rotate(360deg)}}';
            document.head.appendChild(styleEl);
        }

        // Fade in overlay
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });

        // Attempt backend logout (best-effort), clear client state
        try { fetch('/logout', { method: 'POST' }).catch(() => { }); } catch (err) { }
        localStorage.removeItem('user');

        // Wait for the fade to be visible, then navigate
        setTimeout(() => { window.location.href = 'auth.html'; }, 520);
    }

    // Wire forms/buttons
    document.querySelectorAll('form[action="/logout"]').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            performLogout();
        });
    });

    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            performLogout();
        });
    });
}

function generateColor(name) {
    const colors = [
        "linear-gradient(135deg, #7779f0, #773cff)",
        "linear-gradient(135deg, #ee60a7, #F43F5E)",
        "linear-gradient(135deg, #2cccb9, #089db7)",
        "linear-gradient(135deg, #ff6a00, #f4b64c)",
        "linear-gradient(135deg, #3cbdf9, #494cee)",
        "linear-gradient(135deg, #2bd49c, #128f80)"
    ];

    let index = name.charCodeAt(0) % colors.length;
    return colors[index];
}


async function initBrowsePage() {

    const currentUser = JSON.parse(localStorage.getItem("user"));

    try {

        // 1️⃣ Fetch all mentors
        const usersRes = await fetch("http://127.0.0.1:5000/all-users");
        const users = await usersRes.json();

        // 2️⃣ Fetch my requests (to detect status)
        const reqRes = await fetch(`http://127.0.0.1:5000/my-requests/${currentUser.email}`);
        const reqData = await reqRes.json();

        // Build request map
        const requestMap = {};

        reqData.sent.forEach(req => {
            const key = `${req.to_user_id}_${req.skill}`;
            requestMap[key] = req.status;
        });

        const tableBody = document.getElementById("teachersTableBody");
        tableBody.innerHTML = "";

        let count = 0;

        users.forEach(user => {

            if (user.email === currentUser.email) return;

            user.skills_offered.forEach(skill => {

                const row = document.createElement("tr");
                row.className = "teacher-row";
                row.dataset.name = user.name.toLowerCase();
                row.dataset.skill = skill.name.toLowerCase();
                row.dataset.category = skill.category.toLowerCase();

                const key = `${user.id}_${skill.name}`;
                const status = requestMap[key];

                let buttonHTML = "";

                if (!status) {
                    buttonHTML = `
                        <button class="request-btn-sm"
                            onclick="sendRequest('${user.id}', '${skill.name}', '${skill.category}', this)">
                            Request
                        </button>
                    `;
                } 
                else if (status === "pending") {
                    buttonHTML = `
                        <button class="request-btn-sm" disabled style="background:#f59e0b;">
                            Pending
                        </button>
                    `;
                } 
                else if (status === "accepted") {
                    buttonHTML = `
                        <button class="request-btn-sm" disabled style="background:#10b981;">
                            Exchanged
                        </button>
                    `;
                } 
                else if (status === "rejected") {
                    buttonHTML = `
                        <button class="request-btn-sm"
                            onclick="sendRequest('${user.id}', '${skill.name}', '${skill.category}', this)">
                            Request Again
                        </button>
                    `;
                }

                row.innerHTML = `
                    <td class="mentor-cell">
                        <div class="mentor-info">
                            <div class="mentor-avatar" 
                            style="background:${generateColor(user.name)}">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="mentor-details">
                                <a href="teacher-profile.html?id=${user.id}" class="mentor-name">
                                     ${user.name}
                                </a>
                                <span class="mentor-title">${user.title}</span>
                            </div>
                        </div>
                    </td>
                    <td class="skill-cell">${skill.name}</td>
                    <td class="category-cell">
                        <span class="category-badge">${skill.category}</span>
                    </td>
                    <td class="credits-cell">
                        <span class="credit-badge">
                            <i class="fas fa-bolt"></i> 1
                        </span>
                    </td>
                    <td class="action-cell">
                        ${buttonHTML}
                    </td>
                `;

                tableBody.appendChild(row);
                count++;
            });
        });

        document.getElementById("teachersCount").innerText = count;

        filterTeachers();

    } catch (err) {
        console.error("Browse load error:", err);
    }
}

async function sendRequest(toUserId, skillName, skillCategory, button) {

    const currentUser = JSON.parse(localStorage.getItem("user"));

    try {
        const buttons = document.querySelectorAll(".request-btn-sm");
        buttons.forEach(btn => btn.disabled = true);
        if (currentUser.credits <= 0) {
            alert("You do not have enough credits.");
            return;
        }
        const res = await fetch("http://127.0.0.1:5000/create-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                from_user_id: currentUser.id,
                to_user_id: toUserId,
                skill: skillName,
                skill_category: skillCategory,
                message: "I'd like to learn this skill."
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        //  Show smooth popup
        showRequestSuccessPopup(skillName);
        await initBrowsePage();


    } catch (err) {
        console.error(err);
        alert("Something went wrong.");
    }
}


async function initProfilePage() {

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    // Avatar
    const avatar = document.getElementById("profileAvatar");
    if (avatar) {
        const initials = user.name
            .split(" ")
            .map(w => w[0])
            .join("")
            .toUpperCase();

        avatar.innerText = initials;
        avatar.style.background = generateColor(user.name);
    }

    // Basic Info
    document.getElementById("profileName").innerText = user.name;
    document.getElementById("profileUsername").innerText = "@" + user.username;
    document.getElementById("profileTitle").innerText = user.title || "No title added";
    document.getElementById("profileLocation").innerText = user.location || "No location set";
    document.getElementById("profileBio").innerText = user.bio || "No bio added yet";
    document.getElementById("profileEmail").innerText = user.email;

    // ===== MEMBER SINCE DYNAMIC =====
if (user.created_at) {
    const date = new Date(user.created_at);

    const options = { month: "long", year: "numeric" };
    const formatted = date.toLocaleDateString("en-US", options);

    document.getElementById("memberSince").innerText =
        `Member since ${formatted}`;
} else {
    document.getElementById("memberSince").innerText = "Member since —";
}
    // Skills Offered
    const offeredList = document.getElementById("skillsOfferedList");
    offeredList.innerHTML = "";

    user.skills_offered?.forEach(skill => {
        offeredList.innerHTML += `
    <div class="skill-card">
        <div class="skill-dot" style="background:${generateColor(skill.name)};"></div>
        <div class="skill-info">
            <div class="skill-header">
                <h3>${skill.name}</h3>
                <span class="skill-category-badge">${skill.category}</span>
            </div>
            <p class="skill-description">${skill.description || ""}</p>
        </div>
        <div class="skill-actions">
            <button class="icon-btn edit" onclick="editSkill('${skill.name}')">
                <i class="fas fa-pen"></i>
            </button>
            <button class="icon-btn delete" onclick="deleteSkill('${skill.name}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>
`;
    });

    // Skills Wanted
    const wantedList = document.getElementById("skillsWantedList");
    wantedList.innerHTML = "";

    user.skills_wanted?.forEach(skill => {
        wantedList.innerHTML += `
    <div class="skill-card">
        <div class="skill-dot" style="background:${generateColor(skill.name)};"></div>
        <div class="skill-info">
            <div class="skill-header">
                <h3>${skill.name}</h3>
                <span class="skill-category-badge">${skill.category}</span>
            </div>
            <p class="skill-description">
                ${skill.description || ""}
            </p>
        </div>
        <div class="skill-actions">
            <button class="icon-btn edit"
                onclick="editWantedSkill('${skill.name}')">
                <i class="fas fa-pen"></i>
            </button>
            <button class="icon-btn delete"
                onclick="deleteWantedSkill('${skill.name}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>
`;
    });
}


let currentSkillMode = "offered";
// can be "offered" or "wanted"
// Prompts for now | Modals Later 
// Delete Skill
async function deleteSkill(skillName) {

    const user = JSON.parse(localStorage.getItem("user"));

    const updatedSkills = user.skills_offered.filter(
        skill => skill.name !== skillName
    );

    try {
        await fetch(`http://127.0.0.1:5000/update-profile/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requester_id: user.id,
                skills_offered: updatedSkills,
                skills_wanted: user.skills_wanted
            })
        });

        user.skills_offered = updatedSkills;
        localStorage.setItem("user", JSON.stringify(user));

        initProfilePage();
        updateNavbar(user);

    } catch (err) {
        console.error(err);
    }
}

// Edit Skill (simple prompt for now)
async function editSkill(skillName) {

    const user = JSON.parse(localStorage.getItem("user"));

    const skill = user.skills_offered.find(s => s.name === skillName);

    const newDescription = prompt("Edit description:", skill.description);

    if (newDescription === null) return;

    skill.description = newDescription;

    try {
        await fetch(`http://127.0.0.1:5000/update-profile/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requester_id: user.id,
                skills_offered: user.skills_offered,
                skills_wanted: user.skills_wanted
            })
        });

        localStorage.setItem("user", JSON.stringify(user));
        initProfilePage();

    } catch (err) {
        console.error(err);
    }
}
async function editWantedSkill(skillName) {

    const user = JSON.parse(localStorage.getItem("user"));

    const skill = user.skills_wanted.find(s => s.name === skillName);

    const newDescription = prompt("Edit description:", skill.description || "");

    if (newDescription === null) return;

    skill.description = newDescription;

    try {
        await fetch(`http://127.0.0.1:5000/update-profile/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requester_id: user.id,
                skills_offered: user.skills_offered,
                skills_wanted: user.skills_wanted
            })
        });

        localStorage.setItem("user", JSON.stringify(user));
        initProfilePage();

    } catch (err) {
        console.error(err);
    }
}
async function deleteWantedSkill(skillName) {

    const user = JSON.parse(localStorage.getItem("user"));

    const updatedWanted = user.skills_wanted.filter(
        skill => skill.name !== skillName
    );

    try {
        await fetch(`http://127.0.0.1:5000/update-profile/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requester_id: user.id,
                skills_offered: user.skills_offered,
                skills_wanted: updatedWanted
            })
        });

        user.skills_wanted = updatedWanted;
        localStorage.setItem("user", JSON.stringify(user));

        initProfilePage();

    } catch (err) {
        console.error(err);
    }
}

function openAddSkillModal(mode) {

    currentSkillMode = mode;

    document.getElementById("addSkillModal").style.display = "flex";

    const modalTitle = document.querySelector("#addSkillModal h3");

    if (mode === "offered") {
        modalTitle.innerText = "Add Skill You're Offering";
    } else {
        modalTitle.innerText = "Add Skill You're Learning";
    }
}

function closeAddSkillModal() {
    document.getElementById("addSkillModal").style.display = "none";

    document.getElementById("newSkillName").value = "";
    document.getElementById("newSkillCategory").value = "";
    document.getElementById("newSkillDescription").value = "";
}

async function saveNewSkill() {

    const user = JSON.parse(localStorage.getItem("user"));

    const name = document.getElementById("newSkillName").value.trim();
    const category = document.getElementById("newSkillCategory").value.trim();
    const description = document.getElementById("newSkillDescription").value.trim();

    if (!name || !category) {
        alert("Skill name and category required");
        return;
    }

    const newSkill = {
        name,
        category,
        description,
        cost: 1
    };

    let updatedOffered = user.skills_offered || [];
    let updatedWanted = user.skills_wanted || [];

    if (currentSkillMode === "offered") {
        updatedOffered = [...updatedOffered, newSkill];
    } else {
        updatedWanted = [...updatedWanted, newSkill];
    }

    try {
        await fetch(`http://127.0.0.1:5000/update-profile/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requester_id: user.id,
                skills_offered: updatedOffered,
                skills_wanted: updatedWanted
            })
        });

        user.skills_offered = updatedOffered;
        user.skills_wanted = updatedWanted;

        localStorage.setItem("user", JSON.stringify(user));

        initProfilePage();
        updateNavbar(user);
        closeAddSkillModal();

    } catch (err) {
        console.error(err);
    }
}

function openEditProfileModal() {

    const user = JSON.parse(localStorage.getItem("user"));

    document.getElementById("editName").value = user.name || "";
    document.getElementById("editTitle").value = user.title || "";
    document.getElementById("editLocation").value = user.location || "";

    document.getElementById("editProfileModal").style.display = "flex";
}

function closeEditProfileModal() {
    document.getElementById("editProfileModal").style.display = "none";
}

async function saveProfileChanges() {

    const user = JSON.parse(localStorage.getItem("user"));

    const newName = document.getElementById("editName").value.trim();
    const newTitle = document.getElementById("editTitle").value.trim();
    const newLocation = document.getElementById("editLocation").value.trim();

    if (!newName) {
        alert("Name is required");
        return;
    }

    try {
        await fetch(`http://127.0.0.1:5000/update-profile/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newName,
                title: newTitle,
                location: newLocation,
                skills_offered: user.skills_offered,
                skills_wanted: user.skills_wanted
            })
        });

        // Update localStorage
        user.name = newName;
        user.title = newTitle;
        user.location = newLocation;

        localStorage.setItem("user", JSON.stringify(user));

        initProfilePage();
        updateNavbar(user);
        closeEditProfileModal();

    } catch (err) {
        console.error(err);
    }
}

function openEditBioModal() {
    const user = JSON.parse(localStorage.getItem("user"));
    document.getElementById("editBioText").value = user.bio || "";
    document.getElementById("editBioModal").style.display = "flex";
}

function closeEditBioModal() {
    document.getElementById("editBioModal").style.display = "none";
}

async function saveBioChanges() {

    const user = JSON.parse(localStorage.getItem("user"));
    const newBio = document.getElementById("editBioText").value.trim();

    try {
        await fetch(`http://127.0.0.1:5000/update-profile/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bio: newBio
            })
        });

        user.bio = newBio;
        localStorage.setItem("user", JSON.stringify(user));

        initProfilePage();
        closeEditBioModal();

    } catch (err) {
        console.error(err);
    }
}

function openEmailModal() {
    const user = JSON.parse(localStorage.getItem("user"));
    document.getElementById("newEmailInput").value = user.email;
    document.getElementById("updateEmailModal").style.display = "flex";
}

function closeEmailModal() {
    document.getElementById("updateEmailModal").style.display = "none";
}

async function saveEmailChanges() {

    const user = JSON.parse(localStorage.getItem("user"));
    const newEmail = document.getElementById("newEmailInput").value.trim();

    if (!newEmail) {
        alert("Email cannot be empty");
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:5000/update-email/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: newEmail })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        // Update localStorage
        user.email = newEmail;
        localStorage.setItem("user", JSON.stringify(user));

        initProfilePage();
        closeEmailModal();

        alert("Email updated successfully!");

    } catch (err) {
        console.error(err);
    }
}

function openPasswordModal() {
    document.getElementById("changePasswordModal").style.display = "flex";
}

function closePasswordModal() {
    document.getElementById("changePasswordModal").style.display = "none";

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
}

async function savePasswordChanges() {

    const user = JSON.parse(localStorage.getItem("user"));

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("All fields required");
        return;
    }
    if (!validateChangePassword(newPassword)) {
    alert("New password does not meet requirements.");
    return;
}

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match");
        return;
    }

    try {
        const res = await fetch(
            `http://127.0.0.1:5000/change-password/${user.id}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        alert("Password changed successfully!");
        closePasswordModal();

    } catch (err) {
        console.error(err);
    }
}

function showRequestSuccessPopup(skillName) {

    const popup = document.getElementById("requestPopup");
    const message = document.getElementById("popupMessage");

    if (!popup) return;

    message.innerHTML = `Your request for <strong>${skillName}</strong> has been sent!`;

    popup.style.display = "flex";
    popup.style.opacity = "0";
    popup.style.transition = "opacity 300ms ease";

    requestAnimationFrame(() => {
        popup.style.opacity = "1";
    });
}


// ===== CHANGE PASSWORD VALIDATION =====

function validateChangePassword(password) {
    const lengthValid = password.length >= 8;
    const upperValid = /[A-Z]/.test(password);
    const lowerValid = /[a-z]/.test(password);
    const numberValid = /[0-9]/.test(password);

    toggleChangeRule("changeRuleLength", lengthValid);
    toggleChangeRule("changeRuleUpper", upperValid);
    toggleChangeRule("changeRuleLower", lowerValid);
    toggleChangeRule("changeRuleNumber", numberValid);

    return lengthValid && upperValid && lowerValid && numberValid;
}

function toggleChangeRule(id, isValid) {
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.remove("valid", "invalid");
    el.classList.add(isValid ? "valid" : "invalid");
}

function setupModalPasswordToggle(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (!input || !icon) return;

    icon.addEventListener("click", function () {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    });
}

// Setup toggles
setupModalPasswordToggle("currentPassword", "toggleCurrentPass");
setupModalPasswordToggle("newPassword", "toggleNewPass");
setupModalPasswordToggle("confirmPassword", "toggleConfirmPass");

// Live validation
const newPassInput = document.getElementById("newPassword");
const changeRules = document.getElementById("changePasswordRules");

if (newPassInput) {
    newPassInput.addEventListener("focus", () => {
        changeRules.classList.add("active");
    });

    newPassInput.addEventListener("input", function () {
        const valid = validateChangePassword(this.value);
        this.style.borderColor = valid ? "#10b981" : "#ef4444";
    });
}