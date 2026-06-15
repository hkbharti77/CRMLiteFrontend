export type FlowType = 'LEAD' | 'APPOINTMENT' | 'BOOKING';

export const getFlowTypeFromNiche = (subCategory: string | null | undefined): FlowType => {
  if (!subCategory) return 'LEAD'; // Default

  const appointments = [
    'Dental Clinics',
    'Skin & Aesthetic Clinics',
    'Physiotherapy & Chiropractic Centers',
    'Homeopathy & Ayurveda Doctors',
    'Career & Study Abroad Counselors',
    'Auto / Used Car Dealers'
  ];

  const bookings = [
    'Premium Salons & Hair Clinics',
    'Wedding & Portrait Photographers',
    'Freelance Makeup Artists (MUA)',
    'Yoga & Meditation Instructors',
    'Gym / Personal Fitness Trainers',
    'Music & Art Classes'
  ];

  if (appointments.includes(subCategory)) {
    return 'APPOINTMENT';
  }

  if (bookings.includes(subCategory)) {
    return 'BOOKING';
  }

  return 'LEAD';
};
