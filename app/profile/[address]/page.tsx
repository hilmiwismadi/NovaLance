import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SkillTag from '@/components/profile/SkillTag';
import ExperienceCard from '@/components/profile/ExperienceCard';
import ProjectHistory from '@/components/profile/ProjectHistory';
import { formatAddress } from '@/lib/utils';

// Mock user profile data (in production, fetch by address)
const mockUserProfile = {
  address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  ens: 'bob.eth',
  rating: 4.9,
  reviewCount: 18,
  memberSince: 'December 2025',
  bio: 'Experienced Solidity developer and smart contract auditor. Passionate about DeFi and building secure protocols.',
  skills: ['Solidity', 'Smart Contracts', 'Security', 'React', 'Hardhat'],
  experience: [
    {
      id: 'e1',
      company: 'DeFi Protocol Labs',
      role: 'Smart Contract Developer',
      description: 'Developed and audited multiple DeFi protocols with TVL over $10M',
      startDate: '2024-03',
      current: true,
    },
  ],
  completedProjects: 15,
  managedProjects: 8,
};

const completedAsFreelancer = [
  {
    id: 'p-bob-1',
    title: 'Smart Contract Security Audit',
    role: 'freelancer' as const,
    status: 'completed',
    completionDate: '2025-12-10',
    review: { rating: 5, comment: 'Thorough audit, found critical bugs!' },
  },
];

const managedAsOwner = [
  {
    id: 'p-bob-2',
    title: 'Token vesting contract',
    role: 'owner' as const,
    status: 'completed',
    completionDate: '2025-11-20',
    review: { rating: 5, comment: 'Clear requirements, great communication.' },
  },
];

export default function UserProfilePage({ params }: { params: { address: string } }) {
  const isOwnProfile = params.address === '0x1234567890abcdef1234567890abcdef12345678';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/jobs" className="inline-flex items-center text-white/60 hover:text-white transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Browse
      </Link>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {mockUserProfile.ens?.[0].toUpperCase() || mockUserProfile.address[2].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{mockUserProfile.ens || 'Anonymous'}</h1>
              <p className="text-white/60 text-sm">{formatAddress(mockUserProfile.address)}</p>
              <p className="text-white/40 text-sm mt-1">Member since {mockUserProfile.memberSince}</p>
            </div>
          </div>
          {!isOwnProfile && (
            <div className="flex gap-2">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </Button>
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Hire for Job
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUserProfile.rating}</p>
            <p className="text-xs text-white/60 mt-1">Rating</p>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(mockUserProfile.rating) ? 'text-yellow-400' : 'text-white/20'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUserProfile.reviewCount}</p>
            <p className="text-xs text-white/60 mt-1">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUserProfile.completedProjects}</p>
            <p className="text-xs text-white/60 mt-1">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUserProfile.managedProjects}</p>
            <p className="text-xs text-white/60 mt-1">Managed</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* As Freelancer Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">As a Freelancer</h2>
          </div>

          {/* Bio */}
          {mockUserProfile.bio && (
            <Card>
              <h3 className="text-sm font-medium text-white/70 mb-2">About</h3>
              <p className="text-sm text-white/80">{mockUserProfile.bio}</p>
            </Card>
          )}

          {/* Skills */}
          <Card>
            <h3 className="text-sm font-medium text-white/70 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {mockUserProfile.skills.map((skill) => (
                <SkillTag key={skill} skill={skill} verified />
              ))}
            </div>
          </Card>

          {/* Experience */}
          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3">Work Experience</h3>
            <div className="space-y-3">
              {mockUserProfile.experience.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))}
            </div>
          </div>

          {/* Completed Projects */}
          <ProjectHistory projects={completedAsFreelancer} title="Completed Projects" />
        </div>

        {/* As Project Owner Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">As a Project Owner</h2>
          </div>

          {/* Owner Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <p className="text-2xl font-bold text-white">{mockUserProfile.managedProjects}</p>
              <p className="text-xs text-white/60 mt-1">Projects Managed</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-brand-300">$3,200</p>
              <p className="text-xs text-white/60 mt-1">Total Spent</p>
            </Card>
          </div>

          {/* Managed Projects */}
          <ProjectHistory projects={managedAsOwner} title="Projects Managed" />

          {/* Reviews */}
          <Card>
            <h3 className="text-sm font-medium text-white/70 mb-3">Recent Reviews</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-white/40">2 days ago</span>
                </div>
                <p className="text-sm text-white/80">"Excellent work on the smart contract audit. Very thorough and professional!"</p>
                <p className="text-xs text-white/40 mt-2">— alice.eth</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
