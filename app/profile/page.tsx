import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SkillTag from '@/components/profile/SkillTag';
import ExperienceCard from '@/components/profile/ExperienceCard';
import ProjectHistory from '@/components/profile/ProjectHistory';
import { mockUser } from '@/lib/mockData';
import { formatAddress } from '@/lib/utils';

// Mock project history data
const completedAsFreelancer = [
  {
    id: 'p-hist-1',
    title: 'DeFi Dashboard Frontend',
    role: 'freelancer' as const,
    status: 'completed',
    completionDate: '2025-12-20',
    review: { rating: 5, comment: 'Excellent work! Delivered on time with great quality.' },
  },
  {
    id: 'p-hist-2',
    title: 'NFT Marketplace Smart Contract',
    role: 'freelancer' as const,
    status: 'completed',
    completionDate: '2025-11-15',
    review: { rating: 4.5, comment: 'Very knowledgeable developer.' },
  },
];

const managedAsOwner = [
  {
    id: 'p-hist-3',
    title: 'Landing Page Design',
    role: 'owner' as const,
    status: 'completed',
    completionDate: '2025-12-15',
    review: { rating: 5, comment: 'Great designer to work with!' },
  },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {mockUser.ens?.[0].toUpperCase() || mockUser.address[2].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{mockUser.ens || 'Anonymous'}</h1>
              <p className="text-white/60 text-sm">{formatAddress(mockUser.address)}</p>
              <p className="text-white/40 text-sm mt-1">Member since {mockUser.memberSince}</p>
            </div>
          </div>
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUser.rating}</p>
            <p className="text-xs text-white/60 mt-1">Rating</p>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(mockUser.rating) ? 'text-yellow-400' : 'text-white/20'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUser.reviewCount}</p>
            <p className="text-xs text-white/60 mt-1">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUser.completedProjects}</p>
            <p className="text-xs text-white/60 mt-1">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUser.managedProjects}</p>
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
          {mockUser.bio && (
            <Card>
              <h3 className="text-sm font-medium text-white/70 mb-2">About</h3>
              <p className="text-sm text-white/80">{mockUser.bio}</p>
            </Card>
          )}

          {/* Skills */}
          <Card>
            <h3 className="text-sm font-medium text-white/70 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {mockUser.skills.map((skill) => (
                <SkillTag key={skill} skill={skill} verified />
              ))}
            </div>
          </Card>

          {/* Experience */}
          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3">Work Experience</h3>
            <div className="space-y-3">
              {mockUser.experience.map((exp) => (
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
              <p className="text-2xl font-bold text-white">{mockUser.managedProjects}</p>
              <p className="text-xs text-white/60 mt-1">Projects Managed</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-brand-300">$4,500</p>
              <p className="text-xs text-white/60 mt-1">Total Spent</p>
            </Card>
          </div>

          {/* Managed Projects */}
          <ProjectHistory projects={managedAsOwner} title="Projects Managed" />

          {/* Hiring Activity */}
          <Card>
            <h3 className="text-sm font-medium text-white/70 mb-3">Hiring Activity</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Jobs Posted</span>
                <span className="text-white">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Freelancers Hired</span>
                <span className="text-white">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Avg. Time to Hire</span>
                <span className="text-white">2.3 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Repeat Hire Rate</span>
                <span className="text-white">60%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Verification Requests */}
      <Card className="border-yellow-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h2 className="text-lg font-semibold text-white">Pending Verifications</h2>
          </div>
          <Link href="/verify">
            <Button size="sm" variant="outline">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div>
              <p className="text-sm font-medium text-white">Verify "React Development" skill</p>
              <p className="text-xs text-white/40 mt-1">Awaiting manual review</p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              Pending
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-medium text-white">Verify completed project</p>
              <p className="text-xs text-white/40 mt-1">"DeFi Dashboard Frontend"</p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Action Required
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
