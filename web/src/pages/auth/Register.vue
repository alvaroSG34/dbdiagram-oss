<template>
  <q-page class="flex flex-center bg-gradient">
    <div class="column items-center" style="max-width: 400px; width: 100%;">
      <!-- Logo/Header -->
      <div class="text-center q-mb-lg">
        <q-icon name="account_tree" size="80px" color="primary" />
        <h4 class="text-weight-light q-mb-sm q-mt-md text-white">DBDiagram</h4>
        <p class="text-grey-4">Únete y colabora en diagramas</p>
      </div>

      <!-- Register Card -->
      <q-card flat bordered class="auth-card full-width q-pa-lg">
        <q-card-section class="text-center q-pb-none">
          <h5 class="text-weight-medium q-mb-sm">Crear Cuenta</h5>
          <p class="text-grey-6">Completa tus datos para registrarte</p>
        </q-card-section>

        <q-card-section>
          <q-form @submit="register" @reset="onReset" class="q-gutter-md">
            <!-- Name -->
            <q-input
              v-model="form.name"
              label="Nombre Completo"
              outlined
              :rules="[
                val => (val && val.length > 0) || 'El nombre es requerido',
                val => (val && val.length >= 2) || 'Mínimo 2 caracteres',
                val => (val && val.length <= 50) || 'Máximo 50 caracteres'
              ]"
              maxlength="50"
              autocomplete="name"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>

            <!-- Email -->
            <q-input
              v-model="form.email"
              label="Correo Electrónico"
              type="email"
              outlined
              :rules="[
                val => (val && val.length > 0) || 'El correo es requerido',
                val => /.+@.+\..+/.test(val) || 'Ingresa un correo válido'
              ]"
              autocomplete="email"
            >
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <!-- Password -->
            <q-input
              v-model="form.password"
              :label="'Contraseña'"
              :type="showPassword ? 'text' : 'password'"
              outlined
              :rules="[
                val => (val && val.length > 0) || 'La contraseña es requerida',
                val => (val && val.length >= 6) || 'Mínimo 6 caracteres'
              ]"
              autocomplete="new-password"
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <!-- Confirm Password -->
            <q-input
              v-model="form.confirmPassword"
              label="Confirmar Contraseña"
              :type="showConfirmPassword ? 'text' : 'password'"
              outlined
              :rules="[
                val => (val && val.length > 0) || 'Confirma tu contraseña',
                val => val === form.password || 'Las contraseñas no coinciden'
              ]"
              autocomplete="new-password"
            >
              <template v-slot:prepend>
                <q-icon name="lock_outline" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>

            <!-- Terms -->
            <q-checkbox
              v-model="form.acceptTerms"
              color="primary"
              class="text-grey-7"
            >
              <template v-slot:default>
                <span class="text-body2">
                  Acepto los 
                  <a href="#" class="text-primary">términos y condiciones</a>
                  y la 
                  <a href="#" class="text-primary">política de privacidad</a>
                </span>
              </template>
            </q-checkbox>

            <!-- Error Message -->
            <q-banner v-if="error" class="bg-negative text-white rounded-borders">
              <template v-slot:avatar>
                <q-icon name="error" />
              </template>
              {{ error }}
            </q-banner>

            <!-- Submit Button -->
            <q-btn
              label="Crear Cuenta"
              type="submit"
              color="primary"
              class="full-width q-mt-lg"
              size="lg"
              :loading="authStore.loading"
              :disable="!isFormValid"
            />
          </q-form>
        </q-card-section>

        <!-- Divider -->
        <q-separator class="q-mx-lg" />

        <!-- Login Link -->
        <q-card-section class="text-center">
          <p class="text-grey-6 q-mb-sm">¿Ya tienes cuenta?</p>
          <q-btn
            label="Iniciar Sesión"
            flat
            color="primary"
            @click="goToLogin"
          />
        </q-card-section>
      </q-card>

      <!-- Footer -->
      <div class="text-center q-mt-lg">
        <p class="text-grey-5 text-caption">
          © {{ currentYear }} DBDiagram - Colaboración en diagramas
        </p>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/store/auth'

export default {
  name: 'RegisterPage',

  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()

    const form = ref({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    })

    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const error = ref('')

    const currentYear = new Date().getFullYear()

    const isFormValid = computed(() => {
      return form.value.name && 
             form.value.name.length >= 2 && 
             form.value.email && 
             /.+@.+\..+/.test(form.value.email) && 
             form.value.password && 
             form.value.password.length >= 6 &&
             form.value.confirmPassword === form.value.password &&
             form.value.acceptTerms
    })

    const register = async () => {
      if (!isFormValid.value) return
      
      error.value = ''

      try {
        const result = await authStore.register({
          username: form.value.name.trim(),
          email: form.value.email.toLowerCase().trim(),
          password: form.value.password
        })

        if (result.success) {
          $q.notify({
            type: 'positive',
            message: `¡Bienvenido ${result.user.username}! Tu cuenta ha sido creada exitosamente.`,
            position: 'top',
            timeout: 4000
          })

          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          error.value = result.error
        }
      } catch (err) {
        console.error('Register error:', err)
        error.value = 'Error inesperado. Intenta nuevamente.'
      }
    }

    const onReset = () => {
      form.value = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
      }
      error.value = ''
    }

    const goToLogin = () => {
      router.push('/auth/login')
    }

    return {
      authStore,
      form,
      showPassword,
      showConfirmPassword,
      error,
      currentYear,
      isFormValid,
      register,
      onReset,
      goToLogin
    }
  }
}
</script>

<style lang="scss" scoped>
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.q-card {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

h4 {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.q-btn {
  font-weight: 500;
}

a {
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.q-checkbox {
  :deep(.q-checkbox__label) {
    line-height: 1.4;
  }
}
</style>