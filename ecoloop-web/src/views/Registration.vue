<!--Registration.vue-->

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/useAuth' // Import the Supabase client

const router = useRouter()

const fullName = ref('')
const location = ref('')
const contactNumber = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isOrganization = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isSubmitting = ref(false)
const errorMessage = ref('')

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleRegister = async () => {
  if (isSubmitting.value) return
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true

  try {
    // Register the user with Supabase, passing extra metadata for the DB trigger
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: fullName.value,
          location: location.value,
          contact_number: contactNumber.value,
          is_org: isOrganization.value,
        }
      }
    })

    if (data?.user) {
      // Manually insert into public.profiles
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName.value,
        location: location.value,
        contact_number: contactNumber.value,
        is_org: isOrganization.value,
      })
    }

    if (error) {
      errorMessage.value = error.message
      return
    }

    // Success! Supabase automatically handles the tokens.
    router.push('/home')
  } catch (err) {
    errorMessage.value = 'Could not reach the server. Please check your connection.'
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
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
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgLtlgdF4HSMs6YY3sOWOsa9dISXXqqVAJVU9Sr9rXdi8kLUqOY4K0B7E&s=10"
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
        src="https://images.stockcake.com/public/4/a/3/4a36e2f2-4b2b-4b91-912b-a4b5baf948a8_large/recycling-in-park-stockcake.jpg"
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
            <svg width="64" height="41" viewBox="0 0 64 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.1875 0.413086L29.5225 1.8584L33.0322 3.92285L36.9551 7.63867V8.05176L37.5742 8.46484L38.1934 9.91016L38.6064 10.1162L38.8125 10.9424L39.2256 11.1484L40.6709 14.8643L41.29 17.9609V23.123H27.8711L28.4902 25.3936L29.5225 27.458L31.3809 29.7295H31.7939L33.8584 26.4258H40.2578L39.6387 28.6973L37.5742 32.2061L35.5098 34.2715V34.6836H35.0967V35.0967H34.6836L33.6514 36.3359H33.2383L31.5869 37.7803L28.4902 39.4326L26.0127 40.2578L19.6133 40.8779L16.5166 40.4648L11.9746 39.0195L11.7676 38.6064L10.1162 37.9873L9.91016 37.5742L8.25781 36.748L4.74805 33.4453V33.0322L3.92285 32.4131V32L2.27051 29.9355L0.826172 26.4258L0 22.5029V18.374L0.826172 14.2451L2.47754 10.5293L4.33594 8.25781V7.84473L7.43262 4.74805H7.84473L10.1162 2.89062L13.626 1.23828L16.7227 0.413086L21.0576 0L25.1875 0.413086ZM14.8643 7.22266L13.2129 8.04785L11.5615 9.49316H11.1484L8.46484 12.3838L6.40039 16.9258V23.7383L7.43262 26.6289L7.84473 26.835L8.05176 27.6611L9.49707 29.3125V29.7256L11.9746 31.9961L14.0391 33.2354H14.4512V32.4092L15.0713 32.2031H14.4512L12.3867 30.1387V27.6611L14.4512 26.0098L16.1035 25.3896H19.6133L20.0254 26.4219L20.6455 26.835V27.4541L18.9932 30.9639L20.8516 28.8994L22.2969 31.377L23.3291 34.4736L24.9805 34.2676L26.4258 33.6484V33.2354L24.5674 30.9639L22.5029 26.835L21.4707 22.293V18.5771L22.5029 14.0352L23.5352 11.5576L23.9482 11.3516L25.1875 8.87402L26.0127 8.46094L27.252 9.08008L30.5547 11.7646L28.4902 15.2734L28.0771 17.1318H34.8906V16.7188L34.2715 14.8613L32.6191 11.9707L31.1738 10.3193H30.7617L30.5547 9.69922H30.1416L28.9033 8.46094L26.2197 7.01562L24.1553 6.39648L18.5811 6.19043L14.8643 7.22266ZM14.4482 26.8359L13.21 27.8682V28.2812H16.3066L17.958 27.6611L18.9902 26.6289V26.0098H16.7197L14.4482 26.8359Z" fill="#778732"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M40.0529 0.206497H46.04L48.311 0.619401L51.4078 1.65166L55.7432 4.12908L59.2529 7.43231V7.84522L60.6981 9.29038L62.7626 13.4194L63.7949 17.342L64.0013 21.8839L63.1755 26.2194L61.111 30.7614L59.6658 32.413V32.8259L56.3626 36.1291H55.9497L55.3303 36.9549L52.8529 38.1936L52.6465 38.6065H52.0271L50.7884 39.4324L48.9303 40.0517L46.04 40.6711L42.1174 40.8775L38.8142 40.4646L34.6852 39.2259L33.24 38.1936L34.6852 37.3678L37.369 34.684L37.7819 33.8582L40.4658 34.684H45.4206L48.9303 33.6517L52.2336 31.7936L55.1239 28.9033L56.982 25.6001L57.8078 22.5033V18.5807L56.982 15.2775L55.7432 12.8001L52.8529 9.49683H52.44L50.7884 8.05167L47.4852 6.6065L44.1819 5.98715L40.4658 6.1936L37.9884 7.01941L35.7174 4.33553H35.3045L34.4787 3.30328L33.24 2.68392L33.4464 2.27102L35.3045 1.44521L40.0529 0.206497Z" fill="#86A2B1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M50.1716 12.59L52.8555 13.8287L52.4426 15.2739L51.6168 15.8932L52.0297 17.9577L51.8232 20.2287L47.9006 28.0739L47.2813 28.6932H45.8361L42.9458 27.2481L42.3264 26.6287L42.12 25.5965L43.5652 22.4997L43.9781 22.2932V21.6739L44.5974 21.0545L45.0103 19.4029L45.4232 19.1965V18.5771L46.0426 17.9577L46.249 17.1319L46.6619 16.9255V16.5126H47.0748V16.0997L47.9006 15.8932L49.5523 14.6545V13.6223L50.1716 12.59Z" fill="#778732"/>
            </svg>
        </div>
        <div class="header-titles">
          <h1 class="title">Create Account</h1>
          <p class="subtitle"> Get in the Loop. Connect with your local green community.</p>
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

        <p v-if="errorMessage" style="color: #D64545; font-size: 13px; margin: 0;">
          {{ errorMessage }}
        </p>
        <!-- Action Buttons -->
        <div class="actions">
            <button type="submit" class="btn-register" :class="{ 'btn-org': isOrganization }" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating account...' : (isOrganization ? 'Sign Up as Organization' : 'Create Account') }}
            </button>

            <span style="align-self: center;">or continue with</span>

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
  background: #778732;
}

.btn-register.btn-org:hover {
  background: #246328;
}

</style>
