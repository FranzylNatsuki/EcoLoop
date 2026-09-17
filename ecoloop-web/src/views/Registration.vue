<script setup lang="ts">
import { ref } from 'vue'

const fullName = ref('')
const location = ref('')
const contactNumber = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isOrganization = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleRegister = () => {
  console.log('Registering user:', {
    fullName: fullName.value,
    location: location.value,
    contactNumber: contactNumber.value,
    email: email.value,
    password: password.value,
    isOrganization: isOrganization.value,
  })
}

const handleGoogleAuth = () => {
  console.log('Google Auth Triggered')
}
</script>

<template>
  <div class="registration-page">
    <!-- Left Background Illustration Card -->
    <div class="bg-illustration left">
      <img
        class="illustration-img"
        src="https://placehold.co/272x200"
        alt="Transforming Waste"
      />
      <div class="illustration-text">
        <h3 class="illustration-title">Transforming Waste</h3>
        <p class="illustration-description">
          Learn composting and zero waste techniques shared live by neighbors.
        </p>
      </div>
    </div>

    <!-- Right Background Illustration Card -->
    <div class="bg-illustration right">
      <img
        class="illustration-img"
        src="https://placehold.co/272x200"
        alt="Upcycling Inspiration"
      />
      <div class="illustration-text">
        <h3 class="illustration-title">Upcycling Inspiration</h3>
        <p class="illustration-description">
          Discover community projects and give a second life to old materials.
        </p>
      </div>
    </div>

    <!-- Registration Main Card -->
    <div class="registration-card">
      <!-- Header Section -->
      <div class="card-header">
        <div class="brand-logo-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </div>
        <div class="header-titles">
          <h1 class="title">Create Account</h1>
          <p class="subtitle">Join the cycle. Connect with your local green community.</p>
        </div>
      </div>

      <!-- Registration Form -->
      <form class="registration-form" @submit.prevent="handleRegister">
        <!-- Full Name / Org Name -->
        <div class="form-group">
          <label for="fullName">{{ isOrganization ? 'Organization / Business Name' : 'Full Name' }}</label>
          <div class="input-wrapper">
            <input
              id="fullName"
              v-model="fullName"
              type="text"
              :placeholder="isOrganization ? 'EcoLoop Foundation Inc.' : 'Juan Dela Cruz'"
              required
            />
          </div>
        </div>

        <!-- Location / Barangay -->
        <div class="form-group">
          <label for="location">Location / Barangay</label>
          <div class="input-wrapper">
            <input
              id="location"
              v-model="location"
              type="text"
              placeholder="Daro, Dumaguete City"
              required
            />
          </div>
        </div>

        <!-- Contact Number Field -->
        <div class="form-group">
          <label for="contactNumber">Contact Number</label>
          <div class="input-wrapper phone-wrapper">
            <span class="phone-prefix">+63</span>
            <input
              id="contactNumber"
              v-model="contactNumber"
              type="tel"
              placeholder="912 345 6789"
              pattern="[0-9\s]{9,11}"
              required
            />
          </div>
        </div>

        <!-- Email Address -->
        <div class="form-group">
          <label for="email">Email Address</label>
          <div class="input-wrapper">
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              class="eye-btn"
              aria-label="Toggle password visibility"
              @click="togglePasswordVisibility"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8F9A8F"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              class="eye-btn"
              aria-label="Toggle confirm password visibility"
              @click="toggleConfirmPasswordVisibility"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8F9A8F"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <!-- Organization Checkbox -->
        <div class="checkbox-group">
          <label class="checkbox-container">
            <input type="checkbox" v-model="isOrganization" />
            <span class="checkmark"></span>
            <span class="checkbox-label">Registering on behalf of an Organization or NGO</span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="actions">
          <button type="submit" class="btn-register" :class="{ 'btn-org': isOrganization }">
            {{ isOrganization ? 'Sign Up as Organization' : 'Create Account' }}
          </button>

          <div class="divider">
            <div class="line"></div>
            <span>or continue with</span>
            <div class="line"></div>
          </div>

          <button
            type="button"
            class="btn-social"
            @click="handleGoogleAuth"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1D1A"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v8M8 12h8"></path>
            </svg>
            Google
          </button>
        </div>
      </form>

      <!-- Footer / Back to Login -->
      <div class="card-footer">
        <span class="footer-text">Already have an account? </span>
        <RouterLink to="/login" class="login-link">
          Sign In
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Wrapper */
.registration-page {
  width: 100%;
  min-height: 100vh;
  padding: 80px 24px;
  position: relative;
  background-color: #F7F8F6;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

/* Side Illustration Floating Cards */
.bg-illustration {
  width: 320px;
  padding: 24px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  box-shadow: 0px 8px 24px rgba(26, 29, 26, 0.04);
  border-radius: 24px;
  border: 1px solid #E4E7E3;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bg-illustration.left {
  left: 60px;
}

.bg-illustration.right {
  right: 60px;
}

.illustration-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 16px;
}

.illustration-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.illustration-title {
  margin: 0;
  color: #1A1D1A;
  font-size: 16px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}

.illustration-description {
  margin: 0;
  color: #525A52;
  font-size: 13px;
  font-family: 'Geist', sans-serif;
  font-weight: 400;
  line-height: 1.4;
}

/* Registration Card Component */
.registration-card {
  width: 100%;
  max-width: 538px;
  padding: 40px;
  background: white;
  box-shadow: 0px 12px 32px rgba(26, 29, 26, 0.06);
  border-radius: 24px;
  border: 1px solid #E4E7E3;
  display: flex;
  flex-direction: column;
  gap: 28px;
  z-index: 10;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.brand-logo-icon {
  color: #778732;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-titles {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.title {
  margin: 0;
  color: #1A1D1A;
  font-size: 32px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  color: #525A52;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  font-weight: 400;
  line-height: 1.5;
}

/* Form Styling */
.registration-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #525A52;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #F7F8F6;
  border-radius: 12px;
  border: 1px solid #E4E7E3;
}

.input-wrapper input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  color: #1A1D1A;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  font-weight: 400;
}

.input-wrapper input::placeholder {
  color: #8F9A8F;
}

.eye-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* Actions Section */
.actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.btn-register {
  width: 100%;
  padding: 14px;
  background: #778732;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-register:hover {
  background: #647328;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.divider .line {
  flex: 1;
  height: 1px;
  background: #E4E7E3;
}

.divider span {
  color: #8F9A8F;
  font-size: 13px;
  font-family: 'Geist', sans-serif;
}

.btn-social {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 1px solid #E4E7E3;
  border-radius: 12px;
  color: #1A1D1A;
  font-size: 15px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-social:hover {
  background-color: #f8f9fa;
}

/* Footer Section */
.card-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  color: #525A52;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
}

.signin-link {
  color: #778732;
  font-weight: 600;
  text-decoration: none;
}

.signin-link:hover {
  text-decoration: underline;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .bg-illustration {
    display: none;
  }
}

@media (max-width: 600px) {
  .registration-page {
    padding: 24px 16px;
  }

  .registration-card {
    padding: 24px 20px;
  }
}

.checkbox-group {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 28px;
  cursor: pointer;
  font-size: 13px;
  font-family: 'Geist', sans-serif;
  color: #525A52;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: #F7F8F6;
  border: 1px solid #E4E7E3;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: #E8F0E8;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #778732;
  border-color: #778732;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label {
  line-height: 1.4;
}

/* Optional Org Button Highlight Modifier */
.btn-register.btn-org {
  background: #2f7d32;
}

.btn-register.btn-org:hover {
  background: #246328;
}

</style>
