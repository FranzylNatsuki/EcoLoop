<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const isSubmitting = ref(false)
const errorMessage = ref('')

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// TODO: move to an env var once deployed
const API_BASE_URL = 'http://localhost:5167'

const handleLogin = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })

    // Safely parse JSON response
    let data: any = {}
    try {
      data = await res.json()
    } catch {
      // Handles non-JSON error payloads gracefully
    }

    if (!res.ok) {
      errorMessage.value =
        data.error ||
        data.detail ||
        `Login failed (${res.status}). Please check your credentials.`
      return
    }

    // Save auth session details
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    if (data.userId) {
      localStorage.setItem('userId', data.userId)
    }

    router.push('/home')
  } catch (err) {
    errorMessage.value = 'Could not reach the server. Please check your connection.'
    console.error('Login error:', err)
  } finally {
    isSubmitting.value = false
  }
}

const handleGoogleAuth = () => {
  console.log('Google Auth Triggered')
}
</script>

<template>
  <div class="login-page">
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

    <!-- Login Main Card -->
    <div class="login-card">
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
          <h1 class="title">Welcome</h1>
          <p class="subtitle">Join the cycle. Connect with your local green community.</p>
        </div>
      </div>

      <!-- Form Inputs -->
      <form class="login-form" @submit.prevent="handleLogin">
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

        <!-- Forgot Password -->
        <div class="forgot-password-wrapper">
          <RouterLink to="/forgot-password" class="forgot-link">
            Forgot password?
          </RouterLink>
        </div>

        <p v-if="errorMessage" style="color: #D64545; font-size: 13px; margin: 0;">
          {{ errorMessage }}
        </p>
        <!-- Action Buttons -->
        <div class="actions">
            <button type="submit" class="btn-login" :disabled="isSubmitting">
              {{ isSubmitting ? 'Signing in...' : 'Sign In' }}
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

      <!-- Footer / Registration Link -->
      <div class="card-footer">
        <RouterLink to="/register" class="register-link">
          Create an account
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout */
.login-page {
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

/* Card Container */
.login-card {
  width: 100%;
  max-width: 460px;
  padding: 40px;
  background: white;
  box-shadow: 0px 12px 32px rgba(26, 29, 26, 0.06);
  border-radius: 24px;
  border: 1px solid #E4E7E3;
  display: flex;
  flex-direction: column;
  gap: 32px;
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
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.forgot-password-wrapper {
  display: flex;
  justify-content: flex-end;
}

.forgot-link {
  color: #778732;
  font-size: 13px;
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* Action Controls */
.actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn-login {
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

.btn-login:hover {
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
}

.register-link {
  color: #778732;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .bg-illustration {
    display: none;
  }
}

@media (max-width: 500px) {
  .login-page {
    padding: 24px 16px;
  }

  .login-card {
    padding: 24px 20px;
  }
}
</style>
