<script setup lang="ts">
import { createClientUPProvider } from '@lukso/up-provider'
import { ref, watch } from 'vue'
import Web3, {
  type SupportedProviders,
  utils,
  type EthExecutionAPI,
} from 'web3'

import type { ProfileQuery } from '@/.nuxt/gql/default'

const chainId = ref<number | null>(null)
const accounts = ref<string[]>([])
const contextAccounts = ref<string[]>([])
const walletConnected = ref<boolean>(false)
const web3 = ref<Web3 | null>(null)
const profile = ref<ProfileQuery['profile'] | null>(null)

// Allocate the client up provider.
let provider: SupportedProviders<EthExecutionAPI> | null = null
onMounted(async () => {
  provider = createClientUPProvider()
  web3.value = new Web3(provider as SupportedProviders<EthExecutionAPI>)
  // Initially retrieve chainId and accounts
  web3.value.eth
    ?.getChainId()
    .then(_chainId => {
      chainId.value = Number(_chainId)
      walletConnected.value =
        accounts.value.length > 0 && contextAccounts.value.length > 0
    })
    .catch(error => {
      console.warn(error)
    })
  web3.value.eth
    ?.getAccounts()
    .then(_accounts => {
      accounts.value = _accounts || []
    })
    .catch(error => {
      console.warn(error)
    })
  provider
    .request('up_contextAccounts', [])
    .then(_accounts => {
      contextAccounts.value = _accounts || []
    })
    .catch(error => {
      console.warn(error)
    })
  // Monitor accountsChanged and chainChanged events
  provider.on('accountsChanged', (_accounts: `0x${string}`[]) => {
    accounts.value = [..._accounts]
  })
  provider.on('contextAccountsChanged', (_accounts: `0x${string}`[]) => {
    contextAccounts.value = [..._accounts]
  })
  provider.on('chainChanged', (_chainId: number) => {
    chainId.value = _chainId
  })
})

// Watch all changes and compose a walletConnected boolean flag
watch(
  () =>
    [chainId.value, accounts.value, contextAccounts.value] as [
      number,
      Array<`0x${string}`>,
      Array<`0x${string}`>
    ],
  async ([chainId, accounts, contextAccounts]: [
    number,
    Array<`0x${string}`>,
    Array<`0x${string}`>
  ]) => {
    walletConnected.value =
      accounts?.length > 0 &&
      contextAccounts?.length > 0 &&
      (chainId === 42 || chainId === 4201)

    const { profile: _profile }: ProfileQuery = await GqlProfile({
      id: contextAccounts[0] || '',
    })

    profile.value = _profile
    isLoaded.value = true
  }
)

const error = ref('') // Error message for validation feedback
const amount = ref(1)

// Validation limits
const minAmount = 0.25 // Minimum allowed value
const maxAmount = 1000 // Maximum allowed value

const address = computed(() => contextAccounts.value[0])

const isLoaded = ref(false)

// Watch and validate input
const validateAmount = () => {
  if (amount.value < minAmount) {
    error.value = `Amount must be at least ${minAmount} LYX.`
  } else if (amount.value > maxAmount) {
    error.value = `Amount cannot exceed ${maxAmount} LYX.`
  } else {
    error.value = '' // Clear error if valid
  }
}

// Optionally validate immediately on load or updates
watch(amount, validateAmount)
async function donate() {
  web3.value?.eth.sendTransaction(
    {
      from: accounts.value[0],
      to: contextAccounts.value[0],
      value: utils.toWei(amount.value, 'ether'),
    },
    undefined,
    { checkRevertBeforeSending: false }
  )
}
</script>

<template>
  <div
    class="flex h-screen flex-col items-center justify-center rounded-8 border border-neutral-95 px-8"
  >
    <template v-if="isLoaded">
      <div class="heading-inter-17-semi-bold pb-4">Donate LYX to</div>

      <lukso-profile
        :profile-url="profile?.profileImages?.[0]?.url"
        :profile-address="address"
        size="medium"
        has-identicon
        class="mb-2"
      >
      </lukso-profile>
      <lukso-username
        v-if="profile?.name"
        :name="profile?.name"
        :address="address"
        size="medium"
        max-width="300"
      ></lukso-username>

      <div class="w-full max-w-[400px]">
        <lukso-input
          :value="amount"
          :min="minAmount"
          :max="maxAmount"
          :error="error"
          placeholder="Enter Amount"
          is-full-width
          class="mb-4 mt-6"
          @on-input="validateAmount"
        ></lukso-input>

        <lukso-button
          variant="landing"
          is-full-width
          :disabled="!walletConnected || !amount ? true : undefined"
          @click="donate"
          >Donate LYX</lukso-button
        >
      </div>
    </template>
    <lukso-icon
      v-else
      name="progress-indicator-alt"
      size="x-large"
    ></lukso-icon>
  </div>
</template>
