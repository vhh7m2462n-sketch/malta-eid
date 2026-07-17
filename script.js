const PROFILE_KEY = "identityPortalProfile";
const SESSION_KEY = "identityPortalSession";
const LOCK_KEY = "identityPortalLocked";
const PHOTO_KEY = "identityPortalPhoto";

const authPage = document.getElementById("authPage");
const profilePage = document.getElementById("profilePage");
const signInForm = document.getElementById("signInForm");
const loginMessage = document.getElementById("loginMessage");
const signOutBtn = document.getElementById("signOutBtn");
const photoInput = document.getElementById("photoInput");
const mainPhotoButton = document.getElementById("mainPhotoButton");
const headerPhotoButton = document.getElementById("headerPhotoButton");
const mainPhoto = document.getElementById("mainPhoto");
const headerPhoto = document.getElementById("headerPhoto");
const lockDetailsBtn = document.getElementById("lockDetailsBtn");
const lockMessage = document.getElementById("lockMessage");

const defaultPhoto =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360">
      <rect width="300" height="360" fill="#eaf7f9"/>
      <circle cx="150" cy="115" r="62" fill="#1498b2" opacity=".5"/>
      <path d="M55 330c8-78 45-118 95-118s87 40 95 118" fill="#1498b2" opacity=".5"/>
    </svg>
  `);

function readStorage(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProfile() {
  return readStorage(PROFILE_KEY, {
    fullName: "",
    reference: "",
    birth: "",
    email: "",
    phone: "",
    address: ""
  });
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function setPhoto(source) {
  mainPhoto.src = source;
  headerPhoto.src = source;
}

function updateProfileView() {
  const profile = getProfile();
  const name = profile.fullName || "";

  document.getElementById("headerName").textContent = name || "Your name";
  document.getElementById("headerRef").textContent = profile.reference || "Reference number";

  document.getElementById("displayName").textContent =
    name || "Tap icon to add name";
  document.getElementById("displayReference").textContent =
    profile.reference || "Tap icon to add reference number";
  document.getElementById("displayBirth").textContent =
    formatDate(profile.birth) || "Tap icon to add date of birth";
  document.getElementById("displayEmail").textContent =
    profile.email || "Tap icon to add email";
  document.getElementById("displayPhone").textContent =
    profile.phone || "Tap icon to add phone number";
  document.getElementById("displayAddress").textContent =
    profile.address || "Tap icon to add address";

  document.getElementById("editName").value = profile.fullName || name;
  document.getElementById("editReference").value = profile.reference || "";
  document.getElementById("editBirth").value = profile.birth || "";
  document.getElementById("editEmail").value = profile.email || "";
  document.getElementById("editPhone").value = profile.phone || "";
  document.getElementById("editAddress").value = profile.address || "";

  setPhoto(localStorage.getItem(PHOTO_KEY) || defaultPhoto);
  applyLockedState();
}


function isProfileLocked(){return localStorage.getItem(LOCK_KEY)==="true";}
function applyLockedState(){
 const locked=isProfileLocked();
 document.querySelectorAll(".circle-icon").forEach(b=>{b.disabled=locked;b.classList.toggle("locked",locked);});
 document.querySelectorAll(".save-detail").forEach(b=>b.disabled=locked);
 document.querySelectorAll(".editor").forEach(e=>{e.classList.toggle("locked",locked);if(locked)e.classList.add("hidden");});
 mainPhotoButton.disabled=locked;headerPhotoButton.disabled=locked;
 mainPhotoButton.classList.toggle("locked",locked);headerPhotoButton.classList.toggle("locked",locked);
 lockDetailsBtn.disabled=locked;
 if(locked){lockDetailsBtn.textContent="Details Locked";lockMessage.textContent="Your details have been confirmed and locked.";}
 else{lockDetailsBtn.textContent="Lock & Confirm Details";lockMessage.textContent="";}
}

function showProfile() {
  authPage.classList.remove("active");
  profilePage.classList.add("active");
  updateProfileView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAuth() {
  profilePage.classList.remove("active");
  authPage.classList.add("active");
  signInForm.reset();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

signInForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!username || !password) {
    loginMessage.textContent = "Enter your ID number and password.";
    return;
  }

  sessionStorage.setItem("identityPortalTemporaryLogin", "true");
  localStorage.setItem(SESSION_KEY, "saved");
  showProfile();
});

signOutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem("identityPortalTemporaryLogin");
  showAuth();
});

document.querySelectorAll("[data-editor]").forEach((button) => {
  button.addEventListener("click", () => {
    if (isProfileLocked()) return;
    const editor = document.getElementById(button.dataset.editor);
    editor.classList.toggle("hidden");
  });
});

document.querySelectorAll("[data-save]").forEach((button) => {
  button.addEventListener("click", () => {
    if (isProfileLocked()) return;
    const profile = getProfile();
    const type = button.dataset.save;

    if (type === "identity") {
      profile.fullName = document.getElementById("editName").value.trim();
      profile.reference = document.getElementById("editReference").value.trim();
    }

    if (type === "birth") {
      profile.birth = document.getElementById("editBirth").value;
    }

    if (type === "email") {
      profile.email = document.getElementById("editEmail").value.trim();
    }

    if (type === "phone") {
      profile.phone = document.getElementById("editPhone").value.trim();
    }

    if (type === "address") {
      profile.address = document.getElementById("editAddress").value.trim();
    }

    writeStorage(PROFILE_KEY, profile);
    updateProfileView();
    button.closest(".editor").classList.add("hidden");
  });
});

function openPhotoPicker() {
  if (isProfileLocked()) return;
  photoInput.click();
}

mainPhotoButton.addEventListener("click", openPhotoPicker);
headerPhotoButton.addEventListener("click", openPhotoPicker);

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    photoInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    localStorage.setItem(PHOTO_KEY, reader.result);
    setPhoto(reader.result);
  });
  reader.readAsDataURL(file);
});


const saveLoginBtn = document.getElementById("saveLoginBtn");
const sessionMessage = document.getElementById("sessionMessage");

saveLoginBtn.addEventListener("click", () => {
  localStorage.setItem(SESSION_KEY, "saved");
  sessionMessage.textContent = "Login info saved. You will stay on the profile page after refresh.";
});


lockDetailsBtn.addEventListener("click",()=>{
 if(!window.confirm("Are you sure you want to lock and confirm these details? They cannot be edited afterwards.")) return;
 localStorage.setItem(LOCK_KEY,"true");
 localStorage.setItem(SESSION_KEY,"saved");
 sessionStorage.setItem("identityPortalTemporaryLogin","true");
 applyLockedState();
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(`${button.dataset.tab}Tab`).classList.add("active");
  });
});

setPhoto(localStorage.getItem(PHOTO_KEY) || defaultPhoto);


if (localStorage.getItem(SESSION_KEY) === "saved" || sessionStorage.getItem("identityPortalTemporaryLogin") === "true") {
  showProfile();
} else {
  showAuth();
}
