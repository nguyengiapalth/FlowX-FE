export interface ValidationError {
  field: string;
  message: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateProfileForm = (data: {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  position?: string;
  bio?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
}): ProfileValidationResult => {
  const errors: ValidationError[] = [];

  // Validate full name
  if (!data.fullName || data.fullName.trim().length === 0) {
    errors.push({ field: 'fullName', message: 'Họ và tên không được để trống' });
  } else if (data.fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Họ và tên phải có ít nhất 2 ký tự' });
  } else if (data.fullName.trim().length > 100) {
    errors.push({ field: 'fullName', message: 'Họ và tên không được quá 100 ký tự' });
  }

  // Validate phone number
  if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{8,15}$/;
    if (!phoneRegex.test(data.phoneNumber.trim())) {
      errors.push({ field: 'phoneNumber', message: 'Số điện thoại không hợp lệ' });
    }
  }

  // Validate date of birth
  if (data.dateOfBirth && data.dateOfBirth.trim().length > 0) {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const minAge = new Date();
    minAge.setFullYear(today.getFullYear() - 100);
    const maxAge = new Date();
    maxAge.setFullYear(today.getFullYear() - 16);

    if (isNaN(birthDate.getTime())) {
      errors.push({ field: 'dateOfBirth', message: 'Ngày sinh không hợp lệ' });
    } else if (birthDate > today) {
      errors.push({ field: 'dateOfBirth', message: 'Ngày sinh không thể là ngày trong tương lai' });
    } else if (birthDate < minAge) {
      errors.push({ field: 'dateOfBirth', message: 'Ngày sinh không hợp lệ' });
    } else if (birthDate > maxAge) {
      errors.push({ field: 'dateOfBirth', message: 'Bạn phải ít nhất 16 tuổi' });
    }
  }

  // Validate address
  if (data.address && data.address.trim().length > 500) {
    errors.push({ field: 'address', message: 'Địa chỉ không được quá 500 ký tự' });
  }

  // Validate position
  if (data.position && data.position.trim().length > 100) {
    errors.push({ field: 'position', message: 'Chức vụ không được quá 100 ký tự' });
  }

  // Validate bio
  if (data.bio && data.bio.trim().length > 1000) {
    errors.push({ field: 'bio', message: 'Giới thiệu không được quá 1000 ký tự' });
  }



  // Validate social media URLs
  const urlRegex = /^https?:\/\/.+\..+/i;
  
  if (data.facebook && data.facebook.trim().length > 0 && !urlRegex.test(data.facebook.trim())) {
    errors.push({ field: 'facebook', message: 'URL Facebook không hợp lệ' });
  }

  if (data.linkedin && data.linkedin.trim().length > 0 && !urlRegex.test(data.linkedin.trim())) {
    errors.push({ field: 'linkedin', message: 'URL LinkedIn không hợp lệ' });
  }

  if (data.twitter && data.twitter.trim().length > 0 && !urlRegex.test(data.twitter.trim())) {
    errors.push({ field: 'twitter', message: 'URL Twitter không hợp lệ' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getFieldError = (errors: ValidationError[], fieldName: string): string | null => {
  const error = errors.find(e => e.field === fieldName);
  return error ? error.message : null;
}; 