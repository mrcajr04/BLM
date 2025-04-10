import { db, auth, provider, signInWithPopup, signOut } from './firebase-config.js';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const templatesTab = document.getElementById('templates-tab');
const reviewsTab = document.getElementById('reviews-tab');
const templateSearch = document.getElementById('template-search');
const reviewSearch = document.getElementById('review-search');
const newTemplateBtn = document.getElementById('new-template-btn');
const logCallBtn = document.getElementById('log-call-btn');
const templateModal = document.getElementById('template-modal');
const reviewModal = document.getElementById('review-modal');
const deleteModal = document.getElementById('delete-modal');
const deleteConfirmInput = document.getElementById('delete-confirmation');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const templatesTableBody = document.getElementById('templates-table-body');
const reviewsTableBody = document.getElementById('reviews-table-body');
const mainContent = document.getElementById('main-content');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const welcomeMessage = document.getElementById('welcome-message');

// Tab Switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(button.dataset.tab).classList.remove('hidden');
        
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });
        button.classList.remove('border-transparent', 'text-gray-500');
        button.classList.add('border-blue-500', 'text-blue-600');
    });
});

// Modal Management
function showModal(modal) {
    modal.classList.remove('hidden');
}

function hideModal(modal) {
    modal.classList.add('hidden');
    if (modal.querySelector('form')) {
        modal.querySelector('form').reset();
    }
}

document.querySelectorAll('.modal-close').forEach(button => {
    button.addEventListener('click', () => {
        hideModal(button.closest('.modal'));
    });
});

// Templates CRUD Operations
let currentDeleteId = null;
let currentDeleteType = null;

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        showUserInfo(user);
        setupUserData(user);
        mainContent.classList.remove('hidden');
        loginBtn.classList.add('hidden');
    } else {
        // User is signed out
        hideUserInfo();
        mainContent.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        clearTableData();
    }
});

// Authentication functions
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .catch((error) => {
            console.error("Error signing in:", error);
            let errorMessage = "Error signing in. ";
            switch (error.code) {
                case 'auth/configuration-not-found':
                    errorMessage += "Firebase Authentication is not properly configured. Please check the Firebase Console settings.";
                    break;
                case 'auth/popup-blocked':
                    errorMessage += "Popup was blocked by your browser. Please allow popups for this site.";
                    break;
                case 'auth/popup-closed-by-user':
                    return; // Don't show error for user-closed popup
                case 'auth/cancelled-popup-request':
                    return; // Don't show error for cancelled requests
                default:
                    errorMessage += "Please try again later.";
            }
            alert(errorMessage);
        });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth)
        .catch((error) => {
            console.error("Error signing out:", error);
            alert("Error signing out. Please try again.");
        });
});

function showUserInfo(user) {
    userInfo.classList.remove('hidden');
    welcomeMessage.textContent = `Welcome, ${user.displayName}!`;
}

function hideUserInfo() {
    userInfo.classList.add('hidden');
    welcomeMessage.textContent = '';
}

function clearTableData() {
    templatesTableBody.innerHTML = '';
    reviewsTableBody.innerHTML = '';
}

function setupUserData(user) {
    // Set up real-time listeners for user-specific data
    const templatesQuery = query(
        collection(db, "templates"),
        where("userId", "==", user.uid)
    );

    const reviewsQuery = query(
        collection(db, "callReviews"),
        where("userId", "==", user.uid)
    );

    // Update existing CRUD functions to include user ID
    onSnapshot(templatesQuery, (snapshot) => {
        templatesTableBody.innerHTML = '';
        snapshot.docs.forEach(doc => {
            templatesTableBody.appendChild(renderTemplate(doc));
        });
    });

    onSnapshot(reviewsQuery, (snapshot) => {
        reviewsTableBody.innerHTML = '';
        snapshot.docs.forEach(doc => {
            reviewsTableBody.appendChild(renderReview(doc));
        });
    });
}

// Update create functions to include user ID
async function createTemplate(name, message) {
    if (!auth.currentUser) return;
    try {
        await addDoc(collection(db, "templates"), {
            name,
            message,
            userId: auth.currentUser.uid,
            createdAt: new Date()
        });
        hideModal(templateModal);
    } catch (error) {
        console.error("Error creating template:", error);
        alert("Error creating template. Please try again.");
    }
}

function renderTemplate(doc) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-normal break-words w-48">
            <div class="text-sm text-gray-900 truncate">${doc.data().name}</div>
        </td>
        <td class="px-6 py-4 whitespace-normal break-words flex-1">
            <div class="text-sm text-gray-500">${doc.data().message}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-32">
            <button class="text-blue-600 hover:text-blue-900 mr-3 copy-btn" title="Copy message">
                <i class="fas fa-copy"></i>
            </button>
            <button class="text-indigo-600 hover:text-indigo-900 mr-3 modify-btn">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900 delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;

    // Copy functionality
    tr.querySelector('.copy-btn').addEventListener('click', (e) => {
        navigator.clipboard.writeText(doc.data().message);
        const button = e.currentTarget;
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 1000);
    });

    // Modify functionality
    tr.querySelector('.modify-btn').addEventListener('click', () => {
        document.getElementById('template-modal-title').textContent = 'Modify Template';
        document.getElementById('template-name').value = doc.data().name;
        document.getElementById('template-message').value = doc.data().message;
        showModal(templateModal);
        currentDeleteId = doc.id;
    });

    // Delete functionality
    tr.querySelector('.delete-btn').addEventListener('click', () => {
        currentDeleteId = doc.id;
        currentDeleteType = 'template';
        showModal(deleteModal);
    });

    return tr;
}

// Call Reviews CRUD Operations
async function createReview(date, link, description, quality) {
    if (!auth.currentUser) return;
    try {
        await addDoc(collection(db, "callReviews"), {
            date,
            link,
            description,
            quality,
            userId: auth.currentUser.uid,
            createdAt: new Date()
        });
        hideModal(reviewModal);
    } catch (error) {
        console.error("Error creating review:", error);
        alert("Error creating review. Please try again.");
    }
}

function renderReview(doc) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap w-32">
            <div class="text-sm text-gray-900">${doc.data().date}</div>
        </td>
        <td class="px-6 py-4 whitespace-normal break-words w-48">
            <div class="flex items-center space-x-2">
                <a href="${doc.data().link}" target="_blank" class="text-blue-600 hover:text-blue-900 truncate">
                    ${doc.data().link}
                </a>
                <button class="text-blue-600 hover:text-blue-900 copy-link-btn" title="Copy link">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-normal break-words flex-1">
            <div class="text-sm text-gray-500">${doc.data().description}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap w-24">
            <div class="text-sm text-gray-900">${doc.data().quality}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-32">
            <button class="text-indigo-600 hover:text-indigo-900 mr-3 modify-btn">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900 delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;

    // Copy link functionality
    tr.querySelector('.copy-link-btn').addEventListener('click', (e) => {
        navigator.clipboard.writeText(doc.data().link);
        const button = e.currentTarget;
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 1000);
    });

    // Modify functionality
    tr.querySelector('.modify-btn').addEventListener('click', () => {
        document.getElementById('review-modal-title').textContent = 'Modify Review';
        document.getElementById('review-date').value = doc.data().date;
        document.getElementById('review-link').value = doc.data().link;
        document.getElementById('review-description').value = doc.data().description;
        document.getElementById('review-quality').value = doc.data().quality;
        showModal(reviewModal);
        currentDeleteId = doc.id;
    });

    // Delete functionality
    tr.querySelector('.delete-btn').addEventListener('click', () => {
        currentDeleteId = doc.id;
        currentDeleteType = 'review';
        showModal(deleteModal);
    });

    return tr;
}

// Search functionality
templateSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    templatesTableBody.querySelectorAll('tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.classList.toggle('hidden', !text.includes(query));
    });
});

reviewSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    reviewsTableBody.querySelectorAll('tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.classList.toggle('hidden', !text.includes(query));
    });
});

// Delete confirmation
deleteConfirmInput.addEventListener('input', (e) => {
    confirmDeleteBtn.disabled = e.target.value !== 'DELETE';
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (currentDeleteId && currentDeleteType) {
        try {
            const docRef = doc(db, currentDeleteType === 'template' ? 'templates' : 'callReviews', currentDeleteId);
            await deleteDoc(docRef);
            hideModal(deleteModal);
            deleteConfirmInput.value = '';
            currentDeleteId = null;
            currentDeleteType = null;
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Error deleting document. Please try again.");
        }
    }
});

// Form submissions
document.getElementById('template-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('template-name').value;
    const message = document.getElementById('template-message').value;
    await createTemplate(name, message);
});

document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('review-date').value;
    const link = document.getElementById('review-link').value;
    const description = document.getElementById('review-description').value;
    const quality = document.getElementById('review-quality').value;
    await createReview(date, link, description, quality);
});

// New item buttons
newTemplateBtn.addEventListener('click', () => {
    document.getElementById('template-modal-title').textContent = 'New Template';
    showModal(templateModal);
});

logCallBtn.addEventListener('click', () => {
    document.getElementById('review-modal-title').textContent = 'Log Call';
    showModal(reviewModal);
}); 