import type { Profile } from '../types/requestReview'

export type ProfileType = 'agent' | 'location'

export interface User {
  id: string
  name: string
  email: string
  role: string
  title: string
  profileType: ProfileType
  profileId: string
}

export interface DemoUser extends User {
  password: string
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'john-smith',
    name: 'John Smith',
    email: 'john.smith@example.com',
    password: 'demo123',
    role: 'Professional',
    title: 'Mortgage Loan Officer',
    profileType: 'agent',
    profileId: 'prof-john',
  },
  {
    id: 'sarah-williams',
    name: 'Sarah Williams',
    email: 'sarah.williams@example.com',
    password: 'demo123',
    role: 'Professional',
    title: 'Real Estate Agent',
    profileType: 'agent',
    profileId: 'prof-sarah',
  },
  {
    id: 'austin-downtown',
    name: 'Austin Downtown',
    email: 'austin@example.com',
    password: 'demo123',
    role: 'Location',
    title: 'Branch Location',
    profileType: 'location',
    profileId: 'loc-austin',
  },
]

export function toPublicUser(user: DemoUser): User {
  const { password: _password, ...publicUser } = user
  return publicUser
}

export function profileFromUser(user: User): Profile {
  return {
    id: user.profileId,
    name: user.name,
    kind: user.profileType === 'location' ? 'location' : 'professional',
    title: user.title,
  }
}
