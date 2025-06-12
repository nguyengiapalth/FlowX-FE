class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/auth/google/callback';
  }

  /**
   * Initialize Google Identity Services
   */
  async initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Google Identity Services script
      if (!document.getElementById('google-identity-script')) {
        const script = document.createElement('script');
        script.id = 'google-identity-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;

        script.onload = () => {
          console.log('Google Identity Services loaded');
          resolve();
        };

        script.onerror = () => {
          reject(new Error('Failed to load Google Identity Services'));
        };

        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }

  /**
   * Sign in with Google using redirection
   */
  async signInWithRedirect(): Promise<void> {
    await this.initializeGoogleAuth();

    if (!this.clientId) {
      throw new Error('Google Client ID not configured');
    }

    // Redirect to Google's OAuth 2.0 server using implicit flow to get id_token directly
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=id_token token&scope=${encodeURIComponent('openid email profile')}&nonce=${Math.random().toString(36).substring(2, 15)}&prompt=consent`;

    window.location.href = redirectUrl;
  }

  /**
   * Render Google Sign-In button
   * 
   * This implementation creates a custom button that looks like Google's button
   * but uses redirection instead of popup when clicked
   */
  async renderSignInButton(
    element: HTMLElement, 
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    } = {}
  ): Promise<void> {
    await this.initializeGoogleAuth();

    return new Promise((resolve) => {
      // Create a custom button that looks like Google's button
      element.innerHTML = '';

      // Create button element
      const button = document.createElement('button');
      button.className = 'google-sign-in-button';

      // Set button style based on options
      const theme = options.theme || 'outline';
      const size = options.size || 'large';
      const text = options.text || 'signin_with';
      const shape = options.shape || 'rectangular';

      // Apply styles based on options
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.width = '100%';
      button.style.padding = size === 'large' ? '12px 24px' : size === 'medium' ? '10px 20px' : '8px 16px';
      button.style.borderRadius = shape === 'rectangular' ? '8px' : shape === 'pill' ? '20px' : shape === 'circle' ? '50%' : '8px';
      button.style.fontSize = size === 'large' ? '16px' : size === 'medium' ? '14px' : '12px';
      button.style.fontWeight = '600';
      button.style.cursor = 'pointer';
      button.style.transition = 'all 0.2s ease-in-out';
      button.style.border = 'none';
      button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';

      // Apply FlowX gradient theme
      button.style.background = 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)';
      button.style.color = 'white';

      // Add hover effects
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.02)';
        button.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      });

      button.addEventListener('mousedown', () => {
        button.style.transform = 'scale(0.98)';
      });

      button.addEventListener('mouseup', () => {
        button.style.transform = 'scale(1.02)';
      });

      // Add Google logo
      const googleLogo = document.createElement('span');
      googleLogo.innerHTML = `
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
          <path fill="white" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="white" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="white" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="white" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      `;
      googleLogo.style.marginRight = '12px';

      // Add text based on option
      let buttonText;
      if (text === 'signin_with') {
        buttonText = 'Đăng nhập với Google';
      } else if (text === 'signup_with') {
        buttonText = 'Đăng ký với Google';
      } else if (text === 'continue_with') {
        buttonText = 'Tiếp tục với Google';
      } else {
        buttonText = 'Đăng nhập';
      }

      // Add text to button
      button.appendChild(googleLogo);
      button.appendChild(document.createTextNode(buttonText));

      // Add click event to redirect to Google
      button.addEventListener('click', async () => {
        try {
          await this.signInWithRedirect();
        } catch (error) {
          console.error('Failed to redirect to Google:', error);
        }
      });

      // Add button to element
      element.appendChild(button);

      resolve();
    });
  }

  /**
   * Check if Google Auth is available
   */
  isAvailable(): boolean {
    return !!this.clientId && typeof window !== 'undefined';
  }
}

export default new GoogleAuthService(); 
