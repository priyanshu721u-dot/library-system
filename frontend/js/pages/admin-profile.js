// Check auth
requireAuth('admin');

const user = getUser();
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
loadAvatar();
loadSidebarAvatar();
// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
});

document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
});

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}
// Avatar - stored in localStorage per user


function uploadAvatar(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            // Crop to square
            const min = Math.min(img.width, img.height);
            const sx = (img.width - min) / 2;
            const sy = (img.height - min) / 2;
            ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);

            const userId = getUser()._id;
            localStorage.setItem(`avatar_${userId}`, compressed);

            const avatarEl = document.getElementById('profileAvatar');
            avatarEl.innerHTML = `<img src="${compressed}" style="width:100%; height:100%;
                object-fit:cover; border-radius:50%;">`;
            document.getElementById('removeAvatarBtn').style.display = 'inline-block';

            const sidebarAvatar = document.getElementById('userAvatar');
            if (sidebarAvatar) {
                sidebarAvatar.innerHTML = `<img src="${compressed}" style="width:100%; height:100%;
                    object-fit:cover; border-radius:50%;">`;
            }
            showToast('Profile photo updated!');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeAvatar() {
    const userId = getUser()._id;
    localStorage.removeItem(`avatar_${userId}`);

    const user = getUser();
    const initial = user.username.charAt(0).toUpperCase();
    document.getElementById('profileAvatar').innerHTML = initial;
    document.getElementById('removeAvatarBtn').style.display = 'none';

    const sidebarAvatar = document.getElementById('userAvatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initial;

    showToast('Profile photo removed');
}
// Load profile
async function loadProfile() {
    try {
        const res = await apiCall('/api/profile');
        if (!res.ok) return;

        const p = res.data;
        document.getElementById('profileAvatar').textContent = p.username.charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = p.username;
        document.getElementById('profileEmail').textContent = p.email;
        document.getElementById('updateUsername').value = p.username;
        document.getElementById('updateEmail').value = p.email;
        loadAvatar();
    } catch (e) {}
}

// Update profile
document.getElementById('updateProfileBtn').addEventListener('click', async () => {
    const username = document.getElementById('updateUsername').value.trim();
    const email = document.getElementById('updateEmail').value.trim();

    document.getElementById('profileError').style.display = 'none';
    document.getElementById('profileSuccess').style.display = 'none';

    if (!username || !email) {
        document.getElementById('profileErrorText').textContent = 'Please fill in all fields.';
        document.getElementById('profileError').style.display = 'flex';
        return;
    }

    if (username.length < 3) {
        document.getElementById('profileErrorText').textContent = 'Username must be at least 3 characters.';
        document.getElementById('profileError').style.display = 'flex';
        return;
    }

    const btn = document.getElementById('updateProfileBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Updating...';

    try {
        const res = await apiCall('/api/profile/update', 'PUT', { username, email });

        if (!res.ok) {
            document.getElementById('profileErrorText').textContent = res.data.message || 'Update failed.';
            document.getElementById('profileError').style.display = 'flex';
            return;
        }

        const currentUser = getUser();
        currentUser.username = username;
        currentUser.email = email;
        localStorage.setItem('user', JSON.stringify(currentUser));

        document.getElementById('userName').textContent = username;
        document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = username;
        document.getElementById('profileEmail').textContent = email;
        document.getElementById('profileAvatar').textContent = username.charAt(0).toUpperCase();

        document.getElementById('profileSuccessText').textContent = 'Profile updated successfully!';
        document.getElementById('profileSuccess').style.display = 'flex';
        showToast('Profile updated successfully!');

    } catch (e) {
        document.getElementById('profileErrorText').textContent = 'Something went wrong.';
        document.getElementById('profileError').style.display = 'flex';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Update Profile</span><i class="fas fa-save"></i>';
    }
});

// Toggle password visibility
['toggleCurrent', 'toggleNew', 'toggleConfirm'].forEach((id, index) => {
    const inputIds = ['currentPassword', 'newPassword', 'confirmNewPassword'];
    document.getElementById(id).addEventListener('click', function () {
        const input = document.getElementById(inputIds[index]);
        if (input.type === 'password') {
            input.type = 'text';
            this.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            this.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});

// Change password
document.getElementById('changePasswordBtn').addEventListener('click', async () => {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('passwordSuccess').style.display = 'none';

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        document.getElementById('passwordErrorText').textContent = 'Please fill in all fields.';
        document.getElementById('passwordError').style.display = 'flex';
        return;
    }

    if (newPassword.length < 6) {
        document.getElementById('passwordErrorText').textContent = 'New password must be at least 6 characters.';
        document.getElementById('passwordError').style.display = 'flex';
        return;
    }

    if (newPassword !== confirmNewPassword) {
        document.getElementById('passwordErrorText').textContent = 'Passwords do not match.';
        document.getElementById('passwordError').style.display = 'flex';
        return;
    }

    const btn = document.getElementById('changePasswordBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Changing...';

    try {
        const res = await apiCall('/api/profile/change-password', 'PUT', {
            currentPassword, newPassword
        });

        if (!res.ok) {
            document.getElementById('passwordErrorText').textContent = res.data.message || 'Failed to change password.';
            document.getElementById('passwordError').style.display = 'flex';
            return;
        }

        document.getElementById('passwordSuccessText').textContent = 'Password changed successfully!';
        document.getElementById('passwordSuccess').style.display = 'flex';
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        showToast('Password changed successfully!');

    } catch (e) {
        document.getElementById('passwordErrorText').textContent = 'Something went wrong.';
        document.getElementById('passwordError').style.display = 'flex';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Change Password</span><i class="fas fa-key"></i>';
    }
});

// Init

loadProfile();