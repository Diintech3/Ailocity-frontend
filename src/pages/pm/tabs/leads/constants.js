export const CATEGORY_MAP = {
  'Real Estate':       ['Residential', 'Commercial', 'Plots', 'Rental'],
  'Healthcare':        ['Hospital', 'Clinic', 'Pharmacy', 'Lab'],
  'Education':         ['School', 'College', 'Coaching', 'Online'],
  'Retail':            ['Grocery', 'Fashion', 'Electronics', 'General'],
  'Restaurant / Food': ['Restaurant', 'Cafe', 'Cloud Kitchen', 'Catering'],
  'IT / Software':     ['Web Dev', 'App Dev', 'SaaS', 'Agency'],
  'Finance':           ['CA', 'Insurance', 'Loans', 'Investment'],
  'Manufacturing':     ['FMCG', 'Industrial', 'Textile', 'Auto Parts'],
  'Logistics':         ['Transport', 'Courier', 'Warehouse'],
  'Salon / Beauty':    ['Salon', 'Spa', 'Makeup', 'Skincare'],
  'Gym / Fitness':     ['Gym', 'Yoga', 'Sports', 'Nutrition'],
  'Legal':             ['Advocate', 'Law Firm', 'Compliance'],
  'Travel':            ['Tour Operator', 'Hotel', 'Visa', 'Cab'],
  'Automobile':        ['Showroom', 'Service Center', 'Spare Parts'],
  'Other':             ['Other'],
}

export const BLANK_LEAD = {
  name: '', email: '', mobile: '', alternateMobile: '',
  company: '', businessType: '', category: '', subCategory: '', logoKey: '',
  websiteUrl: '', gstNumber: '', panNumber: '',
  address: '', city: '', state: '', pincode: '', country: 'India',
  instagramUrl: '', facebookUrl: '', youtubeUrl: '',
  type: 'hot', mbcSubCategory: '', status: 'new', kyc: 'pending', notes: '',
  source: 'Direct', requirement: '', budget: '', priority: 'medium', folderId: '',
}

export const TYPE_COLORS = {
  hot:       'bg-red-100 text-red-700',
  warm:      'bg-orange-100 text-orange-700',
  cold:      'bg-blue-100 text-blue-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  client:    'bg-violet-100 text-violet-700',
}

export const STATUS_COLORS = {
  new:       'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  lost:      'bg-red-100 text-red-700',
}

export const PRIORITY_COLORS = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-blue-100 text-blue-700',
}
