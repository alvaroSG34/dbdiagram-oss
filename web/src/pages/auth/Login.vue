<template>
  <q-page class="flex flex-center bg-gradient">
    <div class="column items-center" style="max-width: 400px; width: 100%;">
      <!-- Logo/Header -->
      <div class="text-center q-mb-lg">
        <q-icon name="account_tree" size="80px" color="primary" />
        <h4 class="text-weight-light q-mb-sm q-mt-md text-white">DBDiagram</h4>
        <p class="text-grey-4">Diagramas colaborativos en tiempo real</p>
      </div>

      <!-- Login Card -->
      <q-card flat bordered class="auth-card full-width q-pa-lg">
        <q-card-section class="text-center q-pb-none">
          <h5 class="text-weight-medium q-mb-sm">Iniciar Sesión</h5>
          <p class="text-grey-6">Ingresa a tu cuenta para continuar</p>
        </q-card-section>

        <q-card-section>
          <q-form @submit="login" @reset="onReset" class="q-gutter-md">
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
                val => (val && val.length > 0) || 'La contraseña es requerida'
              ]"
              autocomplete="current-password"
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

            <!-- Remember Me -->
            <q-checkbox
              v-model="form.remember"
              label="Recordar sesión"
              color="primary"
            />

            <!-- Error Message -->
            <q-banner v-if="error" class="bg-negative text-white rounded-borders">
              <template v-slot:avatar>
                <q-icon name="error" />
              </template>
              {{ error }}
            </q-banner>

            <!-- Submit Button -->
            <q-btn
              label="Iniciar Sesión"
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

        <!-- Register Link -->
        <q-card-section class="text-center">
          <p class="text-grey-6 q-mb-sm">¿No tienes cuenta?</p>
          <q-btn
            label="Crear Cuenta"
            flat
            color="primary"
            @click="goToRegister"
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
  name: 'LoginPage',

  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()

    const form = ref({
      email: '',
      password: '',
      remember: false
    })

    const showPassword = ref(false)
    const error = ref('')

    const currentYear = new Date().getFullYear()

    const isFormValid = computed(() => {
      return form.value.email && 
             /.+@.+\..+/.test(form.value.email) && 
             form.value.password
    })

    const login = async () => {
      if (!isFormValid.value) return
      
      error.value = ''

      try {
        const result = await authStore.login({
          email: form.value.email.toLowerCase().trim(),
          password: form.value.password
        })

        if (result.success) {
          $q.notify({
            type: 'positive',
            message: `¡Bienvenido ${result.user.name}!`,
            position: 'top'
          })

          // Redirect to dashboard or intended route
          const redirect = router.currentRoute.value.query.redirect || '/dashboard'
          router.push(redirect)
        } else {
          error.value = result.error
        }
      } catch (err) {
        console.error('Login error:', err)
        error.value = 'Error inesperado. Intenta nuevamente.'
      }
    }

    const onReset = () => {
      form.value = {
        email: '',
        password: '',
        remember: false
      }
      error.value = ''
    }

    const goToRegister = () => {
      router.push('/auth/register')
    }

    return {
      authStore,
      form,
      showPassword,
      error,
      currentYear,
      isFormValid,
      login,
      onReset,
      goToRegister
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
</style>