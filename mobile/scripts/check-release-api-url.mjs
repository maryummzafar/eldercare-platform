const releaseProfiles = new Set(['preview', 'production']);

export function validateReleaseApiUrl(value) {
  if (!value) {
    throw new Error('EXPO_PUBLIC_API_URL is required for preview and production builds.');
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTPS URL.');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === 'yourdomain.com' ||
    hostname.endsWith('.yourdomain.com') ||
    hostname === 'example.com' ||
    hostname.endsWith('.example.com')
  ) {
    throw new Error('EXPO_PUBLIC_API_URL must use HTTPS and a real, non-placeholder public hostname.');
  }

  return url.toString().replace(/\/+$/, '');
}

if (releaseProfiles.has(process.env.EAS_BUILD_PROFILE)) {
  try {
    validateReleaseApiUrl(process.env.EXPO_PUBLIC_API_URL);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}