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
const bookingsTab = document.getElementById('bookings-tab');
const templateSearch = document.getElementById('template-search');
const reviewSearch = document.getElementById('review-search');
const bookingSearch = document.getElementById('booking-search');
const newTemplateBtn = document.getElementById('new-template-btn');
const logCallBtn = document.getElementById('log-call-btn');
const templateModal = document.getElementById('template-modal');
const reviewModal = document.getElementById('review-modal');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const templatesTableBody = document.getElementById('templates-table-body');
const reviewsTableBody = document.getElementById('reviews-table-body');
const bookingsTableBody = document.getElementById('bookings-table-body');
const mainContent = document.getElementById('main-content');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const welcomeMessage = document.getElementById('welcome-message');
const newBookingBtn = document.getElementById('new-booking-btn');

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
let isModifying = false;
let modifyingId = null;

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
    bookingsTableBody.innerHTML = '';
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

    const bookingsQuery = query(
        collection(db, "bookings"),
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

    onSnapshot(bookingsQuery, (snapshot) => {
        bookingsTableBody.innerHTML = '';
        const sortedDocs = snapshot.docs.sort((a, b) => {
            return a.data().createdAt.toMillis() - b.data().createdAt.toMillis();
        });
        sortedDocs.forEach(doc => {
            bookingsTableBody.appendChild(renderBooking(doc));
        });
    });
}

// Update create functions to include user ID
async function createTemplate(name, message) {
    if (!auth.currentUser) return;
    try {
        if (isModifying && modifyingId) {
            // Update existing template
            await updateDoc(doc(db, "templates", modifyingId), {
                name,
                message,
                updatedAt: new Date()
            });
        } else {
            // Create new template
            await addDoc(collection(db, "templates"), {
                name,
                message,
                userId: auth.currentUser.uid,
                createdAt: new Date()
            });
        }
        hideModal(templateModal);
        isModifying = false;
        modifyingId = null;
    } catch (error) {
        console.error("Error with template:", error);
        alert("Error saving template. Please try again.");
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
        isModifying = true;
        modifyingId = doc.id;
        showModal(templateModal);
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
        if (isModifying && modifyingId) {
            // Update existing review
            await updateDoc(doc(db, "callReviews", modifyingId), {
                date,
                link,
                description,
                quality,
                updatedAt: new Date()
            });
        } else {
            // Create new review
            await addDoc(collection(db, "callReviews"), {
                date,
                link,
                description,
                quality,
                userId: auth.currentUser.uid,
                createdAt: new Date()
            });
        }
        hideModal(reviewModal);
        isModifying = false;
        modifyingId = null;
    } catch (error) {
        console.error("Error with review:", error);
        alert("Error saving review. Please try again.");
    }
}

function renderReview(doc) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${doc.data().date}</div>
        </td>
        <td class="px-6 py-4 whitespace-normal break-words w-48">
            <div class="flex items-center">
                <a href="${doc.data().link}" target="_blank" class="text-blue-600 hover:text-blue-900 text-sm truncate max-w-[200px] block" title="${doc.data().link}">
                    ${doc.data().link}
                </a>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-normal break-words">
            <div class="text-sm text-gray-500">${doc.data().description}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${doc.data().quality}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3 copy-link-btn" title="Copy link">
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
        isModifying = true;
        modifyingId = doc.id;
        showModal(reviewModal);
    });

    // Delete functionality
    tr.querySelector('.delete-btn').addEventListener('click', () => {
        currentDeleteId = doc.id;
        currentDeleteType = 'review';
        showModal(deleteModal);
    });

    return tr;
}

// Bookings CRUD Operations
async function createBooking() {
    if (!auth.currentUser) return;
    try {
        const today = new Date();
        // Format date as YYYY-MM-DD in local timezone
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        const todayFormatted = `${year}-${month}-${day}`;

        const newBooking = {
            date: todayFormatted,
            lead: '',
            type: 'regular',
            client: '',
            userId: auth.currentUser.uid,
            createdAt: today // Keep using the full Date object for sorting
        };
        await addDoc(collection(db, "bookings"), newBooking);
    } catch (error) {
        console.error("Error creating booking:", error);
        alert("Error creating booking. Please try again.");
    }
}

async function updateBooking(bookingId, field, value) {
    if (!auth.currentUser) return;
    try {
        const updateData = {};
        updateData[field] = value;
        updateData.updatedAt = new Date();
        await updateDoc(doc(db, "bookings", bookingId), updateData);
    } catch (error) {
        console.error("Error updating booking:", error);
        alert("Error updating booking. Please try again.");
    }
}

function renderBooking(doc) {
    const tr = document.createElement('tr');
    const data = doc.data();
    
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <input type="date" 
                   class="text-sm text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none" 
                   value="${data.date}"
                   data-field="date">
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <input type="text" 
                   class="text-sm text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full" 
                   value="${data.lead}"
                   placeholder="Enter lead name"
                   data-field="lead">
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <select class="text-sm text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                    data-field="type">
                <option value="regular" ${data.type === 'regular' ? 'selected' : ''}>Regular</option>
                <option value="prepay" ${data.type === 'prepay' ? 'selected' : ''}>Prepay</option>
            </select>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <input type="text" 
                   class="text-sm text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full" 
                   value="${data.client}"
                   placeholder="Enter client name"
                   data-field="client">
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-red-600 hover:text-red-900 delete-booking">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;

    // Add event listeners for inline editing
    tr.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', (e) => {
            updateBooking(doc.id, e.target.dataset.field, e.target.value);
        });
    });

    // Add delete event listener
    tr.querySelector('.delete-booking').addEventListener('click', () => {
        currentDeleteId = doc.id;
        currentDeleteType = 'booking';
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
confirmDeleteBtn.addEventListener('click', async () => {
    if (!currentDeleteId || !currentDeleteType) return;
    
    try {
        if (currentDeleteType === 'template') {
            await deleteDoc(doc(db, "templates", currentDeleteId));
        } else if (currentDeleteType === 'review') {
            await deleteDoc(doc(db, "callReviews", currentDeleteId));
        } else if (currentDeleteType === 'booking') {
            await deleteDoc(doc(db, "bookings", currentDeleteId));
        }
        hideModal(deleteModal);
        currentDeleteId = null;
        currentDeleteType = null;
    } catch (error) {
        console.error("Error deleting item:", error);
        alert("Error deleting item. Please try again.");
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
    isModifying = false;
    modifyingId = null;
    showModal(templateModal);
});

logCallBtn.addEventListener('click', () => {
    document.getElementById('review-modal-title').textContent = 'Log Call';
    isModifying = false;
    modifyingId = null;
    showModal(reviewModal);
});

// Add event listener for new booking button
newBookingBtn.addEventListener('click', createBooking);

// Add search functionality for bookings
bookingSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = bookingsTableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}); 