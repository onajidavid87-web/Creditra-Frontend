import React, { useState, Suspense, lazy } from 'react';
import './Profile.css';

// Lazy load the ActivityTimeline component for the Activity tab
const ActivityTimeline = lazy(() => import('../components/ActivityTimeline'));

/**
 * Profile page component displaying user information with tab navigation.
 * Tabs: Overview (placeholder) | Activity (shows activity timeline).
 */
const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  return (
    <div className="profile-page">
      <h1 className="profile-title">User Profile</h1>
      <nav className="profile-tabs" role="tablist" aria-label="Profile sections">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'activity'}
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </nav>
      <section className="profile-content" role="tabpanel">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Placeholder content – can be expanded later */}
            <p>This is an overview of the user. Add more details as needed.</p>
          </div>
        )}
        {activeTab === 'activity' && (
          <Suspense fallback={<div>Loading activity...</div>}>
            <ActivityTimeline />
          </Suspense>
        )}
      </section>
    </div>
  );
};

export default Profile;
