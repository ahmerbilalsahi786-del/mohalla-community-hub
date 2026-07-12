import { startTransition, useEffect, useRef, useState, type ChangeEvent, type ComponentProps } from 'react'
import { Link, useLocation } from 'wouter'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MohallaBrandLink } from '@/components/brand/mohalla-brand'
import { clearToken, setToken } from '@/lib/auth'
import { sendPendingApprovalEmail } from '@/lib/approval-email'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { hasVerifiedMohallaEmail, sendEmailVerification, verificationPath } from '@/lib/email-verification'
import {
  type JoinableCommunity,
  inviteLoginPath,
  requestMemberJoin,
  searchJoinableCommunities,
} from '@/lib/member-join'
import { reverseGeocodeParts } from '@/lib/geocode'

type RegisterMode = 'create' | 'join'

const CITY_OPTIONS = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Gujranwala',
  'Hyderabad',
  'Sialkot',
]

function emailRedirectTo() {
  const configuredUrl = import.meta.env.VITE_APP_URL?.trim()
  const origin = configuredUrl || window.location.origin

  return `${origin.replace(/\/$/, '')}/login`
}

function geolocationErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'number') {
    switch (error.code) {
      case 1:
        return 'Location access was blocked. Please allow location access and try again.'
      case 2:
        return 'Your location could not be detected right now. Please try again in a moment.'
      case 3:
        return 'Location detection took too long. Please try again.'
      default:
        break
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Could not read your location details right now.'
}

async function detectCurrentLocation() {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Location autofill is not available in this browser.')
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      })
    })

    const location = await reverseGeocodeParts(position.coords.latitude, position.coords.longitude)
    if (location.area || location.city) {
      return {
        ...location,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    }
    throw new Error('We found your location but could not turn it into an area and city.')
  } catch (error) {
    throw new Error(geolocationErrorMessage(error))
  }
}

export default function Register() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const joinParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const joinCommunityId = joinParams.get('join')?.trim() ?? ''
  const invitedCommunityName = joinParams.get('community')?.trim() ?? ''
  const requestedPath = joinParams.get('path') === 'join' ? 'join' : 'create'
  const isMemberInvite = joinCommunityId.length > 0
  const [activeMode, setActiveMode] = useState<RegisterMode>(isMemberInvite ? 'join' : requestedPath)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userId: '',
    name: '',
    unitNumber: '',
    communityName: '',
    communityArea: '',
    communityCity: '',
  })
  const [communityPoint, setCommunityPoint] = useState<{ latitude: number; longitude: number } | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autofillingLocation, setAutofillingLocation] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [communityMatches, setCommunityMatches] = useState<JoinableCommunity[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<JoinableCommunity | null>(null)
  const [searchingCommunities, setSearchingCommunities] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const personalInfoRef = useRef<HTMLDivElement | null>(null)

  const registerMode: RegisterMode = isMemberInvite ? 'join' : activeMode
  const selectedJoinCommunityId = registerMode === 'join'
    ? (isMemberInvite ? joinCommunityId : selectedCommunity?.id ?? '')
    : ''
  const selectedJoinCommunityName = registerMode === 'join'
    ? (isMemberInvite
    ? invitedCommunityName || form.communityName.trim() || 'this community'
    : selectedCommunity?.name || form.communityName.trim() || 'this community')
    : ''
  const loginLink = selectedJoinCommunityId
    ? inviteLoginPath(selectedJoinCommunityId, selectedJoinCommunityName)
    : '/login'

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((current) => ({ ...current, [key]: value }))
    if (key === 'communityName' || key === 'communityArea' || key === 'communityCity') {
      if (!isMemberInvite) setSelectedCommunity(null)
      setSearchMessage('')
    }
  }

  const chooseCommunity = (community: JoinableCommunity) => {
    setSelectedCommunity(community)
    setForm((current) => ({
      ...current,
      communityName: community.name,
      communityArea: community.area || current.communityArea,
      communityCity: community.city || current.communityCity,
    }))
    setSearchMessage(`${community.name} selected. Continue with your personal information.`)

    window.setTimeout(() => {
      personalInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      personalInfoRef.current?.querySelector<HTMLInputElement>('#name')?.focus({ preventScroll: true })
    }, 75)
  }

  useEffect(() => {
    if (isMemberInvite) {
      setActiveMode('join')
      if (invitedCommunityName && !form.communityName.trim()) {
        setForm((current) => ({ ...current, communityName: invitedCommunityName }))
      }
    }
  }, [form.communityName, invitedCommunityName, isMemberInvite])

  useEffect(() => {
    if (typeof window === 'undefined' || isMemberInvite) return

    const url = new URL(window.location.href)
    url.searchParams.set('path', activeMode)
    window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`)
  }, [activeMode, isMemberInvite])

  useEffect(() => {
    if (registerMode !== 'join' || isMemberInvite) {
      setCommunityMatches([])
      setSearchMessage('')
      setSearchingCommunities(false)
      return
    }

    const hasSearchInput = [
      form.communityName.trim(),
      form.communityArea.trim(),
      form.communityCity.trim(),
    ].some((value) => value.length >= 2)

    if (!hasSearchInput) {
      setCommunityMatches([])
      setSelectedCommunity(null)
      setSearchMessage('')
      setSearchingCommunities(false)
      return
    }

    let active = true
    const timer = window.setTimeout(async () => {
      setSearchingCommunities(true)
      try {
        const results = await searchJoinableCommunities(
          form.communityName,
          form.communityArea,
          form.communityCity,
        )

        if (!active) return

        startTransition(() => {
          setCommunityMatches(results)
          setSelectedCommunity((current) => {
            if (current && results.some((community) => community.id === current.id)) return current
            return null
          })
        })

        setSearchMessage(
          results.length === 0
            ? 'No approved community matched that search yet.'
            : `${results.length} approved communit${results.length === 1 ? 'y' : 'ies'} found.`,
        )
      } catch (error) {
        if (!active) return
        setCommunityMatches([])
        setSelectedCommunity(null)
        setSearchMessage(error instanceof Error ? error.message : 'Could not search communities right now.')
      } finally {
        if (active) setSearchingCommunities(false)
      }
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [
    form.communityArea,
    form.communityCity,
    form.communityName,
    isMemberInvite,
    registerMode,
  ])

  const autofillLocation = async () => {
    setAutofillingLocation(true)
    try {
      const location = await detectCurrentLocation()
      if (!location.area && !location.city) {
        throw new Error('We found your location but could not turn it into an area and city.')
      }

      setForm((current) => ({
        ...current,
        communityArea: location.area || current.communityArea,
        communityCity: location.city || current.communityCity,
      }))
      setCommunityPoint({ latitude: location.latitude, longitude: location.longitude })
      toast({
        title: 'Location filled in',
        description: [location.area, location.city].filter(Boolean).join(', ') || 'Your current area is ready.',
      })
    } catch (error) {
      toast({
        title: 'Location autofill failed',
        description: error instanceof Error ? error.message : 'Please enter the area and city manually.',
        variant: 'destructive',
      })
    } finally {
      setAutofillingLocation(false)
    }
  }

  const requestSignedInMemberJoin = async () => {
    if (!selectedJoinCommunityId) {
      throw new Error('Choose an approved community before sending the join request.')
    }

    await requestMemberJoin(selectedJoinCommunityId, {
      username: form.userId,
      fullName: form.name,
      unitNumber: form.unitNumber,
    })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.id) {
      try {
        await sendPendingApprovalEmail(user.id)
      } catch (error) {
        console.warn('Pending approval email could not be sent:', error)
      }
    }
    toast({
      title: 'Join request submitted',
      description: `Your approval request has been sent to ${selectedJoinCommunityName}.`,
    })
    navigate('/pending-approval')
  }

  const signInExistingJoinMember = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error || !data.session?.access_token) {
      toast({
        title: 'Account already exists',
        description: 'Sign in with this account to continue the join request.',
        variant: 'destructive',
      })
      navigate(loginLink)
      return true
    }

    const emailVerified = await hasVerifiedMohallaEmail(data.user.id)
    if (!emailVerified) {
      try {
        await sendEmailVerification({ userId: data.user.id, email: data.user.email ?? form.email })
        toast({
          title: 'Confirm your email first',
          description: 'We sent a verification link before this account can continue.',
        })
      } catch (error) {
        toast({
          title: 'Confirm your email first',
          description: error instanceof Error ? error.message : 'Use the resend button on the next page.',
          variant: 'destructive',
        })
      }
      await supabase.auth.signOut()
      clearToken()
      navigate(verificationPath(data.user.email ?? form.email))
      return true
    }

    setToken(data.session.access_token)
    await requestSignedInMemberJoin()
    return true
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const nextErrors: Record<string, string[]> = {}
      if (!/^[a-z0-9_-]+$/.test(form.userId)) {
        nextErrors.userId = ['Use lowercase letters, numbers, - and _ only']
      }
      if (form.password.length < 12) {
        nextErrors.password = ['Password must be at least 12 characters']
      }
      if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = ['Passwords do not match']
      }
      if (!form.name.trim()) {
        nextErrors.name = ['Full name is required']
      }
      if (!form.unitNumber.trim()) {
        nextErrors.unitNumber = ['Unit number is required']
      }

      if (registerMode === 'create') {
        if (!form.communityName.trim()) nextErrors.communityName = ['Society name is required']
        if (!form.communityArea.trim()) nextErrors.communityArea = ['Area is required']
        if (!form.communityCity.trim()) nextErrors.communityCity = ['City is required']
      } else if (!selectedJoinCommunityId) {
        nextErrors.communityName = ['Choose a matching approved community before continuing']
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors)
        return
      }

      const registrationData = registerMode === 'join'
        ? {
            username: form.userId,
            full_name: form.name,
            name: form.name,
            unit_number: form.unitNumber,
            registration_type: 'member',
            join_community_id: selectedJoinCommunityId,
          }
        : {
            username: form.userId,
            full_name: form.name,
            name: form.name,
            unit_number: form.unitNumber,
            registration_type: 'community_admin',
            community_name: form.communityName,
            community_area: form.communityArea,
            community_city: form.communityCity,
            community_latitude: communityPoint ? String(communityPoint.latitude) : null,
            community_longitude: communityPoint ? String(communityPoint.longitude) : null,
          }

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: emailRedirectTo(),
          data: registrationData,
        },
      })

      if (error) {
        const message = error.message?.toLowerCase() ?? ''
        if (registerMode === 'join' && (message.includes('already registered') || message.includes('already exists'))) {
          await signInExistingJoinMember()
          return
        }
        toast({ title: error.message || 'Registration failed', variant: 'destructive' })
        return
      }

      if (data.user?.id) {
        try {
          await sendEmailVerification({ userId: data.user.id, email: data.user.email ?? form.email })
        } catch (error) {
          toast({
            title: 'Account created, but verification email failed',
            description: error instanceof Error ? error.message : 'Please use the resend button on the next page.',
            variant: 'destructive',
          })
        }
      }

      if (data.session?.access_token) {
        await supabase.auth.signOut()
        clearToken()
      }

      if (registerMode === 'join' && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        await signInExistingJoinMember()
        return
      }

      toast({
        title: 'Check your email',
        description: 'Open the verification link before signing in to Mohalla.',
      })
      navigate(verificationPath(data.user?.email ?? form.email))
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Cannot connect to Supabase. Check your project keys.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const areaSuggestions = Array.from(
    new Set(communityMatches.map((community) => community.area).filter(Boolean)),
  )

  const renderTextField = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    props: Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> = {},
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={key} className="text-sm font-bold text-foreground">{label}</label>
      <Input
        id={key}
        name={String(key)}
        value={form[key]}
        onChange={set(key)}
        placeholder={placeholder}
        required
        className="h-12 rounded-2xl bg-white px-4"
        {...props}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key][0]}</p>}
    </div>
  )

  return (
    <main className="mohalla-auth-shell relative min-h-screen overflow-hidden bg-gradient-to-b from-accent/25 via-background to-background">
      <datalist id="register-city-options">
        {CITY_OPTIONS.map((city) => <option key={city} value={city} />)}
      </datalist>
      <datalist id="register-area-options">
        {areaSuggestions.map((area) => <option key={area} value={area} />)}
      </datalist>

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="hidden lg:block">
          <MohallaBrandLink className="mb-12 gap-3" markClassName="rounded-2xl shadow-lg shadow-primary/20" />

          <div className="max-w-xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {registerMode === 'join' ? 'Fast Community Join Flow' : 'Start A New Community'}
            </div>

            <div>
              <h1 className="font-headings text-5xl font-black leading-[1.08] text-foreground">
                {registerMode === 'join'
                  ? `Find your society and send the approval request in one go.`
                  : 'Bring your society online with a cleaner, guided setup.'}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {registerMode === 'join'
                  ? 'Search approved communities by society name and area, create your resident account, and place the request straight into the admin approval queue.'
                  : 'Create the community, fill the location quickly, and submit the admin account that will manage members, notices, and approvals.'}
              </p>
            </div>

            <div className="grid max-w-lg grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-white/75 p-4 shadow-sm backdrop-blur">
                <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                <div className="text-2xl font-black text-foreground">{registerMode === 'join' ? 'Approved' : 'Guided'}</div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {registerMode === 'join' ? 'Only verified communities appear here' : 'Clear sections for location, account, and access'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white/75 p-4 shadow-sm backdrop-blur">
                <MapPin className="mb-3 h-5 w-5 text-accent" />
                <div className="text-2xl font-black text-foreground">Location</div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  Autofill area and city with your current location when you want it.
                </p>
              </div>
            </div>

            <div className="glass max-w-lg rounded-3xl p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-foreground">
                    {registerMode === 'join' ? 'Admin approval stays automatic' : 'Platform approval stays intact'}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {registerMode === 'join'
                      ? 'Once the resident account is created, Mohalla places the request under the selected community for the admin to review.'
                      : 'Community admins still go through the existing approval path, only with a much smoother form.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl">
          <div className="mb-7 text-center lg:hidden">
            <MohallaBrandLink markClassName="rounded-2xl" />
          </div>

          <div className="rounded-[2rem] border border-border bg-white/90 p-5 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-7">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {registerMode === 'join' ? <Users className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
              </div>
              <h2 className="font-headings text-3xl font-black text-foreground">
                {registerMode === 'join'
                  ? (isMemberInvite ? `Join ${selectedJoinCommunityName}` : 'Join Existing Community')
                  : 'Create Your Community'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {registerMode === 'join'
                  ? (isMemberInvite
                    ? 'Create your resident account and send it for admin approval.'
                    : 'Search your approved society, then create the resident account that goes into admin review.')
                  : 'Set up the admin account for your society and send the community for platform approval.'}
              </p>
            </div>

            {!isMemberInvite && (
              <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-muted/50 p-1.5">
                <button
                  type="button"
                  onClick={() => setActiveMode('create')}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition-all ${
                    activeMode === 'create' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 size={15} /> Create
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('join')}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition-all ${
                    activeMode === 'join' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Search size={15} /> Join Existing
                </button>
              </div>
            )}

            <form onSubmit={submit} className="space-y-6">
              <div className="rounded-3xl border border-border bg-muted/30 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">
                      {registerMode === 'join' ? 'Community Match' : 'Community Details'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {registerMode === 'join'
                        ? 'Select your approved society, then continue with your personal details.'
                        : 'Area and city can be filled automatically if you allow location access.'}
                    </p>
                  </div>
                  {registerMode === 'create' && (
                    <button
                      type="button"
                      onClick={autofillLocation}
                      disabled={autofillingLocation}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-white px-3 text-xs font-black text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      <Compass size={14} className={autofillingLocation ? 'animate-spin' : ''} />
                      {autofillingLocation ? 'Finding...' : 'Use My Location'}
                    </button>
                  )}
                </div>

                {registerMode === 'join' && isMemberInvite ? (
                  <div className="rounded-2xl border border-primary/15 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">Invited Community</p>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedJoinCommunityName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Your account will go straight into this community’s admin approval queue.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : registerMode === 'join' && selectedCommunity ? (
                  <div className="rounded-2xl border border-primary/20 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <CheckCircle2 size={19} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{selectedCommunity.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[selectedCommunity.area, selectedCommunity.city].filter(Boolean).join(', ') || 'Approved community selected'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Your request will go directly to this society admin after account creation.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCommunity(null)
                          setSearchMessage('Choose your society from the approved matches.')
                        }}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-white px-3 text-xs font-black text-foreground transition-colors hover:bg-muted"
                      >
                        Change Society
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      {renderTextField(
                        'communityName',
                        registerMode === 'join' ? 'Society Name' : 'Society Name',
                        registerMode === 'join' ? 'Askari 11, DHA Phase 6, Bahria Town...' : 'DHA Phase 5 Residents',
                      )}
                    </div>
                    {registerMode === 'create' && (
                      <>
                        {renderTextField(
                          'communityArea',
                          'Area',
                          'DHA Phase 5',
                        )}
                        {renderTextField(
                          'communityCity',
                          'City',
                          'Karachi',
                          { list: 'register-city-options', required: true },
                        )}
                      </>
                    )}
                  </div>
                )}

                {registerMode === 'join' && !isMemberInvite && !selectedCommunity && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Approved Matches</p>
                      <p className="text-xs text-muted-foreground">
                        {searchingCommunities ? 'Searching...' : searchMessage}
                      </p>
                    </div>

                    {communityMatches.length > 0 ? (
                      <div className="space-y-2">
                        {communityMatches.map((community) => {
                          return (
                            <button
                              key={community.id}
                              type="button"
                              onClick={() => chooseCommunity(community)}
                              className="flex w-full items-start justify-between rounded-2xl border border-border bg-white px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-muted/20"
                            >
                              <div>
                                <p className="text-sm font-black text-foreground">{community.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {[community.area, community.city].filter(Boolean).join(', ') || 'Location available after approval'}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-white/70 p-4 text-sm text-muted-foreground">
                        Search with the society name to see approved communities you can join.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div ref={personalInfoRef} className="rounded-3xl border border-border bg-white p-4 sm:p-5">
                <div className="mb-4">
                  <p className="text-sm font-black text-foreground">Account Details</p>
                  <p className="text-xs text-muted-foreground">
                    {registerMode === 'join'
                      ? 'These details help the admin verify who is requesting access.'
                      : 'This account becomes the first admin for the new community.'}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    {renderTextField('name', 'Full Name', 'Ahmed Khan', { autoComplete: 'name' })}
                  </div>
                  {renderTextField('email', 'Email', 'you@example.com', { type: 'email', autoComplete: 'email', name: 'email' })}
                  {renderTextField('unitNumber', 'Unit Number', 'B-204', { autoComplete: 'address-line2', name: 'unit-number' })}

                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="userId" className="text-sm font-bold text-foreground">Username</label>
                    <Input
                      id="userId"
                      name="mohalla-username"
                      type="text"
                      value={form.userId}
                      onChange={set('userId')}
                      placeholder="ahmed_khan"
                      required
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      pattern="[a-z0-9_-]+"
                      className="h-12 rounded-2xl bg-white px-4"
                    />
                    <p className="text-xs text-muted-foreground">Lowercase letters, numbers, - and _ only</p>
                    {errors.userId && <p className="text-xs text-destructive">{errors.userId[0]}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-bold text-foreground">Password</label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={set('password')}
                        placeholder="Minimum 12 characters"
                        required
                        minLength={12}
                        autoComplete="new-password"
                        name="new-password"
                        className="h-12 rounded-2xl bg-white px-4 pr-11"
                      />
                      <button
                        type="button"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password[0]}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-bold text-foreground">Confirm Password</label>
                    <Input
                      id="confirmPassword"
                      type={showPw ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      placeholder="Repeat your password"
                      required
                      minLength={12}
                      autoComplete="new-password"
                      name="confirm-password"
                      className="h-12 rounded-2xl bg-white px-4"
                    />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword[0]}</p>}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} size="lg" className="h-12 w-full rounded-2xl font-black shadow-lg shadow-primary/20">
                {loading
                  ? 'Creating account...'
                  : <>
                      <UserPlus size={17} />
                      {registerMode === 'join' ? 'Create Account And Send Approval Request' : 'Create Community Account'}
                    </>}
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-5 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href={loginLink} className="inline-flex items-center gap-1 font-black text-primary hover:underline">
                  Sign In <ArrowRight size={14} />
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
