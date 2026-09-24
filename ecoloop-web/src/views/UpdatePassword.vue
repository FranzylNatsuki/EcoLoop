<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/useAuth'

const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handlePasswordUpdate = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    return
  }

  isSubmitting.value = true

  try {
    // Because they clicked the magic email link, Supabase already gave them an active session.
    // We can directly update their password now.
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (error) {
      errorMessage.value = error.message
    } else {
      successMessage.value = 'Password updated successfully! Redirecting...'
      setTimeout(() => {
        router.push('/home') // Log them into the app
      }, 2000)
    }
  } catch (err) {
    errorMessage.value = 'Could not reach the server.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="bg-illustration left">
      <img class="illustration-img" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgLtlgdF4HSMs6YY3sOWOsa9dISXXqqVAJVU9Sr9rXdi8kLUqOY4K0B7E&s=10" alt="Transforming Waste" />
    </div>

    <div class="bg-illustration right">
      <img class="illustration-img" src="https://images.stockcake.com/public/4/a/3/4a36e2f2-4b2b-4b91-912b-a4b5baf948a8_large/recycling-in-park-stockcake.jpg" alt="Upcycling Inspiration" />
    </div>

    <div class="login-card">
      <div class="card-header">
        <div class="header-titles">
          <h1 class="title">Create New Password</h1>
          <p class="subtitle">Enter your new secure password below.</p>
        </div>
      </div>

      <form class="login-form" @submit.prevent="handlePasswordUpdate">

        <!-- New Password -->
        <div class="form-group">
          <label for="new-password">New Password</label>
          <div class="input-wrapper">
            <input
              id="new-password"
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button type="button" class="eye-btn" @click="togglePasswordVisibility">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <div class="input-wrapper">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <p v-if="errorMessage" style="color: #D64545; font-size: 13px; margin: 0;">
          {{ errorMessage }}
        </p>
        <p v-if="successMessage" style="color: #778732; font-size: 13px; margin: 0;">
          {{ successMessage }}
        </p>

        <div class="actions">
          <button type="submit" class="btn-login" :disabled="isSubmitting || successMessage !== ''">
            {{ isSubmitting ? 'Saving...' : 'Update Password' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Paste the EXACT same CSS from Login.vue here! */
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
