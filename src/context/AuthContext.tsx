import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  updateProfile as updateFirebaseProfile,
  updatePassword as updateFirebasePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testConnection } from '../lib/firebase';
import { UserProfile, UserRole, AccountStatus } from '../types/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  registerUser: (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string,
    selectedRole?: 'CUSTOMER' | 'AFFILIATE' | 'EXPERT'
  ) => Promise<{ success: boolean; emailSent?: boolean; emailError?: string; error?: string }>;
  selectRole: (
    targetRole: 'CUSTOMER' | 'AFFILIATE' | 'EXPERT',
    details?: { reason?: string; portfolioUrl?: string; skills?: string[]; channels?: string[] }
  ) => Promise<{ success: boolean; status?: string; message?: string; error?: string }>;
  signInUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  sendResetInstructions: (email: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyEmailWithActionCode: (oobCode: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  reloadCurrentUser: () => Promise<boolean>;
  updateUserProfileData: (data: {
    fullName?: string;
    phoneNumber?: string;
    photoURL?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const isRegisteringRef = useRef<boolean>(false);

  // Initialize and listen to Auth state changes
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isRegisteringRef.current) {
        // Registration in-flight: registerUser handles profile document creation
        return;
      }

      setUser(currentUser);
      if (currentUser && currentUser.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          const isDefaultAdmin =
            currentUser.email?.toLowerCase() === 'nexoviratech@gmail.com' ||
            currentUser.email?.toLowerCase() === 'nexovirasupport@gmail.com';

          if (docSnap.exists()) {
            const data = docSnap.data();
            const resolvedRole: UserRole = isDefaultAdmin ? 'SUPER_ADMIN' : ((data.role as UserRole) || 'CUSTOMER');

            // Auto-heal admin role and ensure admins collection entry exists for platform owners
            if (isDefaultAdmin && (data.role !== 'SUPER_ADMIN')) {
              try {
                await updateDoc(userDocRef, {
                  role: 'SUPER_ADMIN',
                  updatedAt: serverTimestamp(),
                });
                await setDoc(doc(db, 'admins', currentUser.uid), {
                  email: currentUser.email,
                  role: 'SUPER_ADMIN',
                  updatedAt: serverTimestamp(),
                });
              } catch (e) {
                console.warn('Admin profile sync notice:', e);
              }
            }

            setProfile({
              userId: currentUser.uid,
              fullName: data.fullName || currentUser.displayName || (isDefaultAdmin ? 'Nexovira Super Administrator' : 'Member'),
              email: data.email || currentUser.email || '',
              phoneNumber: data.phoneNumber || '',
              photoURL: data.photoURL || currentUser.photoURL || '',
              role: resolvedRole,
              pendingRole: (data.pendingRole as UserRole) || null,
              roleApplicationId: data.roleApplicationId || null,
              accountStatus: (data.accountStatus as AccountStatus) || 'ACTIVE',
              emailVerified: currentUser.emailVerified || data.emailVerified || false,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
            });
          } else {
            // Document does not exist yet (e.g. from new account or Google sign-in)
            const defaultRole: UserRole = isDefaultAdmin ? 'SUPER_ADMIN' : 'CUSTOMER';
            const validName = currentUser.displayName && currentUser.displayName.trim().length >= 2
              ? currentUser.displayName.trim()
              : (isDefaultAdmin ? 'Nexovira Super Administrator' : 'Member');

            const newProfileData = {
              userId: currentUser.uid,
              fullName: validName,
              email: currentUser.email || '',
              phoneNumber: currentUser.phoneNumber || '',
              photoURL: currentUser.photoURL || '',
              role: defaultRole,
              pendingRole: null,
              roleApplicationId: null,
              accountStatus: 'ACTIVE',
              emailVerified: Boolean(currentUser.emailVerified),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            await setDoc(userDocRef, newProfileData);

            if (isDefaultAdmin) {
              try {
                await setDoc(doc(db, 'admins', currentUser.uid), {
                  email: currentUser.email,
                  role: 'SUPER_ADMIN',
                  updatedAt: serverTimestamp(),
                });
              } catch (e) {
                console.warn('Admins collection entry notice:', e);
              }
            }

            setProfile({
              userId: currentUser.uid,
              fullName: validName,
              email: currentUser.email || '',
              phoneNumber: currentUser.phoneNumber || '',
              photoURL: currentUser.photoURL || '',
              role: defaultRole,
              pendingRole: null,
              roleApplicationId: null,
              accountStatus: 'ACTIVE',
              emailVerified: Boolean(currentUser.emailVerified),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Registration Flow
  const registerUser = async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string,
    selectedRole: 'CUSTOMER' | 'AFFILIATE' | 'EXPERT' = 'CUSTOMER'
  ): Promise<{ success: boolean; emailSent?: boolean; emailError?: string; error?: string }> => {
    setLoading(true);
    isRegisteringRef.current = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = userCredential.user;

      // Update Firebase Auth display name
      await updateFirebaseProfile(newUser, {
        displayName: fullName.trim(),
      });

      // Send verification email with actionCodeSettings
      let emailSent = false;
      let emailError: string | undefined = undefined;
      const cleanEmail = (newUser.email || email).trim().toLowerCase();
      try {
        const postVerificationTarget = 'https://nexovira.name.ng';
        const actionCodeSettings = {
          url: `${postVerificationTarget}/verify-email?email=${encodeURIComponent(cleanEmail)}`,
          handleCodeInApp: true,
        };
        try {
          await sendEmailVerification(newUser, actionCodeSettings);
          emailSent = true;
        } catch (linkErr: unknown) {
          if (linkErr instanceof Error && linkErr.message.includes('auth/unauthorized-continue-uri')) {
            await sendEmailVerification(newUser);
            emailSent = true;
          } else {
            throw linkErr;
          }
        }
      } catch (err: unknown) {
        console.warn('Email verification send issue:', err);
        emailSent = false;
        if (err instanceof Error) {
          if (err.message.includes('auth/too-many-requests')) {
            emailError = 'Please wait a minute before requesting another verification email.';
          } else {
            emailError = err.message;
          }
        } else {
          emailError = 'Could not dispatch verification email automatically.';
        }
      }

      // Create User Profile in Firestore
      const userDocRef = doc(db, 'users', newUser.uid);
      const isDefaultAdmin =
        cleanEmail === 'nexoviratech@gmail.com' ||
        cleanEmail === 'nexovirasupport@gmail.com';
      const role: UserRole = isDefaultAdmin ? 'SUPER_ADMIN' : 'CUSTOMER';
      const pendingRole: UserRole | null = (!isDefaultAdmin && selectedRole !== 'CUSTOMER') ? selectedRole : null;
      const cleanPhone = (phoneNumber && phoneNumber.trim().length > 0) ? phoneNumber.trim().slice(0, 25) : '';
      const now = new Date().toISOString();

      let roleApplicationId: string | null = null;
      if (pendingRole) {
        roleApplicationId = `roleapp_${newUser.uid}_${pendingRole.toLowerCase()}`;
      }

      const initialProfile = {
        userId: newUser.uid,
        fullName: fullName.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        photoURL: '',
        role: role,
        pendingRole: pendingRole,
        roleApplicationId: roleApplicationId,
        accountStatus: 'ACTIVE',
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          await updateDoc(userDocRef, {
            fullName: fullName.trim(),
            phoneNumber: cleanPhone,
            role: role,
            pendingRole: pendingRole,
            roleApplicationId: roleApplicationId,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(userDocRef, initialProfile);
        }

        if (isDefaultAdmin) {
          try {
            await setDoc(doc(db, 'admins', newUser.uid), {
              email: cleanEmail,
              role: 'SUPER_ADMIN',
              updatedAt: serverTimestamp(),
            });
          } catch (adminErr) {
            console.warn('Admins collection entry notice:', adminErr);
          }
        }

        // If user selected an elevated specialization during registration, create the review application
        if (pendingRole && roleApplicationId) {
          try {
            const roleAppPayload = {
              applicationId: roleApplicationId,
              userId: newUser.uid,
              userEmail: cleanEmail,
              userName: fullName.trim(),
              currentRole: 'CUSTOMER',
              targetRole: pendingRole,
              status: 'PENDING_REVIEW',
              reason: `Requested ${pendingRole.toLowerCase()} role during account creation.`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'roleApplications', roleApplicationId), roleAppPayload);

            if (pendingRole === 'EXPERT') {
              await setDoc(doc(db, 'expertApplications', newUser.uid), {
                applicationId: newUser.uid,
                userId: newUser.uid,
                fullName: fullName.trim(),
                email: cleanEmail,
                status: 'PENDING_REVIEW',
                submittedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } else if (pendingRole === 'AFFILIATE') {
              await setDoc(doc(db, 'affiliateApplications', roleApplicationId), {
                applicationId: roleApplicationId,
                userId: newUser.uid,
                fullName: fullName.trim(),
                email: cleanEmail,
                phone: cleanPhone,
                status: 'PENDING_REVIEW',
                promotionChannels: ['Registration self-selection'],
                audienceDescription: 'New platform member registration',
                promotionalExperience: 'Initial onboard',
                preferredCategories: ['All'],
                createdAt: now,
                updatedAt: now,
              });
            }
          } catch (appErr) {
            console.warn('Role application creation warning:', appErr);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${newUser.uid}`);
      }

      setUser(newUser);
      setProfile({
        userId: newUser.uid,
        fullName: fullName.trim(),
        email: newUser.email || email.trim(),
        phoneNumber: cleanPhone,
        photoURL: '',
        role: role,
        pendingRole: pendingRole,
        roleApplicationId: roleApplicationId,
        accountStatus: 'ACTIVE',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { success: true, emailSent, emailError };
    } catch (err: unknown) {
      let message = 'Registration failed. Please check your credentials.';
      if (err instanceof Error) {
        if (err.message.includes('auth/email-already-in-use')) {
          message = 'An account with this email address already exists.';
        } else if (err.message.includes('auth/invalid-email')) {
          message = 'Please provide a valid email address.';
        } else if (err.message.includes('auth/weak-password')) {
          message = 'Password does not meet security requirements.';
        } else {
          message = err.message;
        }
      }
      return { success: false, error: message };
    } finally {
      isRegisteringRef.current = false;
      setLoading(false);
    }
  };

  // Role Selection & Multi-Role Pipeline
  const selectRole = async (
    targetRole: 'CUSTOMER' | 'AFFILIATE' | 'EXPERT',
    details?: { reason?: string; portfolioUrl?: string; skills?: string[]; channels?: string[] }
  ): Promise<{ success: boolean; status?: string; message?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be signed in to select or update your role.' };
    }

    if (['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(targetRole as string)) {
      return {
        success: false,
        error: 'Administrative privileges cannot be self-assigned and require direct credentialing by the platform owner.',
      };
    }

    try {
      setLoading(true);
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const isDefaultAdmin =
        cleanEmail === 'nexoviratech@gmail.com' ||
        cleanEmail === 'nexovirasupport@gmail.com';

      if (isDefaultAdmin) {
        return {
          success: true,
          status: 'ACTIVE',
          message: 'System Administrator privileges active.',
        };
      }

      // Try backend endpoint first
      let apiHandled = false;
      let apiMessage = '';
      try {
        const res = await fetch('/api/auth/select-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.uid,
            'x-user-email': cleanEmail,
          },
          body: JSON.stringify({ role: targetRole, ...details }),
        });
        const text = await res.text();
        if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
          const json = JSON.parse(text);
          if (res.ok && json.success) {
            apiHandled = true;
            apiMessage = json.message || '';
          }
        }
      } catch (netErr) {
        console.warn('API role selection notice, persisting via Firestore:', netErr);
      }

      const userDocRef = doc(db, 'users', user.uid);
      const now = new Date().toISOString();

      if (targetRole === 'CUSTOMER') {
        // Immediate switch to Customer role
        await updateDoc(userDocRef, {
          role: 'CUSTOMER',
          pendingRole: null,
          roleApplicationId: null,
          updatedAt: serverTimestamp(),
        });

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                role: 'CUSTOMER',
                pendingRole: null,
                roleApplicationId: null,
                updatedAt: now,
              }
            : null
        );

        return {
          success: true,
          status: 'ACTIVE',
          message: apiMessage || 'Your account role is now set to Customer.',
        };
      } else {
        // Elevated role application (AFFILIATE or EXPERT)
        const appId = `roleapp_${user.uid}_${targetRole.toLowerCase()}`;
        const appData = {
          applicationId: appId,
          userId: user.uid,
          userEmail: cleanEmail,
          userName: profile?.fullName || user.displayName || 'Member',
          currentRole: profile?.role || 'CUSTOMER',
          targetRole,
          status: 'PENDING_REVIEW',
          reason: details?.reason || `Requested ${targetRole.toLowerCase()} role from role selection console.`,
          skills: details?.skills || [],
          portfolioUrl: details?.portfolioUrl || '',
          socialChannels: details?.channels || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'roleApplications', appId), appData);

        if (targetRole === 'EXPERT') {
          await setDoc(doc(db, 'expertApplications', user.uid), {
            applicationId: user.uid,
            userId: user.uid,
            fullName: profile?.fullName || user.displayName || '',
            email: cleanEmail,
            status: 'PENDING_REVIEW',
            skills: details?.skills || [],
            portfolioUrl: details?.portfolioUrl || '',
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else if (targetRole === 'AFFILIATE') {
          await setDoc(doc(db, 'affiliateApplications', appId), {
            applicationId: appId,
            userId: user.uid,
            fullName: profile?.fullName || user.displayName || '',
            email: cleanEmail,
            phone: profile?.phoneNumber || '',
            status: 'PENDING_REVIEW',
            promotionChannels: details?.channels || ['Website', 'Social Media'],
            audienceDescription: details?.reason || 'Nexovira Partner Applicant',
            promotionalExperience: 'Applied through role selector',
            preferredCategories: ['All'],
            createdAt: now,
            updatedAt: now,
          });
        }

        await updateDoc(userDocRef, {
          pendingRole: targetRole,
          roleApplicationId: appId,
          updatedAt: serverTimestamp(),
        });

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                pendingRole: targetRole,
                roleApplicationId: appId,
                updatedAt: now,
              }
            : null
        );

        return {
          success: true,
          status: 'PENDING_REVIEW',
          message:
            apiMessage ||
            `Your ${targetRole.toLowerCase()} application has been submitted and is pending review by management.`,
        };
      }
    } catch (err: unknown) {
      console.error('Role selection failed:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Role selection failed. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign In Flow
  const signInUser = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true };
    } catch (err: unknown) {
      let message = 'Invalid email or password.';
      if (err instanceof Error) {
        if (err.message.includes('auth/user-not-found') || err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-credential')) {
          message = 'Invalid email or password. Please verify your credentials.';
        } else if (err.message.includes('auth/too-many-requests')) {
          message = 'Access temporarily restricted due to multiple failed attempts. Please try again in a few moments.';
        } else {
          message = err.message;
        }
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In (Seamless popup option)
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (err: unknown) {
      let message = 'Google sign-in was cancelled or encountered an issue.';
      if (err instanceof Error) {
        message = err.message;
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Sign Out Flow
  const signOutUser = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Flow (Non-enumerating response)
  const sendResetInstructions = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      console.warn('Password reset invocation completed:', err);
    }
    // Always return neutral response to prevent account enumeration
    return {
      success: true,
      message: "If an account exists for this email, you'll receive instructions to reset your password.",
    };
  };

  // Resend Email Verification
  const resendVerificationEmail = async (): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'No active session found. Please sign in to request a verification email.' };
    }
    try {
      const postVerificationTarget = 'https://nexovira.name.ng';
      const cleanEmail = auth.currentUser.email || '';
      const actionCodeSettings = {
        url: `${postVerificationTarget}/verify-email?email=${encodeURIComponent(cleanEmail)}`,
        handleCodeInApp: true,
      };
      try {
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('auth/unauthorized-continue-uri')) {
          await sendEmailVerification(auth.currentUser);
        } else {
          throw err;
        }
      }
      return { success: true, message: 'Verification link sent successfully. Please check your inbox and spam folder.' };
    } catch (err: unknown) {
      let msg = 'Could not send verification email.';
      if (err instanceof Error) {
        if (err.message.includes('auth/too-many-requests')) {
          msg = 'Too many requests. Please wait a moment before requesting another verification email.';
        } else {
          msg = err.message;
        }
      }
      return { success: false, error: msg };
    }
  };

  // Verify Email with action code from link
  const verifyEmailWithActionCode = async (
    oobCode: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await applyActionCode(auth, oobCode);
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
        setUser({ ...updatedUser });
        const userDocRef = doc(db, 'users', updatedUser.uid);
        await updateDoc(userDocRef, {
          emailVerified: true,
          updatedAt: serverTimestamp(),
        }).catch(() => null);
        if (profile) {
          setProfile({ ...profile, emailVerified: true });
        }
      }
      return { success: true, message: 'Your email address has been successfully verified!' };
    } catch (err: unknown) {
      let msg = 'The verification link is invalid or has expired.';
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-action-code')) {
          msg = 'This verification link is invalid or has already been used.';
        } else if (err.message.includes('auth/expired-action-code')) {
          msg = 'This verification link has expired. Please request a new verification email.';
        } else {
          msg = err.message;
        }
      }
      return { success: false, error: msg };
    }
  };

  // Reload current user to sync email verification status
  const reloadCurrentUser = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser({ ...updatedUser });

      if (updatedUser.emailVerified && profile) {
        const userDocRef = doc(db, 'users', updatedUser.uid);
        try {
          await updateDoc(userDocRef, {
            emailVerified: true,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${updatedUser.uid}`);
        }
        setProfile({ ...profile, emailVerified: true });
      }
      return updatedUser.emailVerified;
    } catch (err) {
      console.error('Failed to reload user state:', err);
      return false;
    }
  };

  // Update Profile (Safe fields only: fullName, phoneNumber, photoURL)
  const updateUserProfileData = async (data: {
    fullName?: string;
    phoneNumber?: string;
    photoURL?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser || !profile) {
      return { success: false, error: 'Authentication required.' };
    }

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const updates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (data.fullName !== undefined) {
        const trimmed = data.fullName.trim();
        if (trimmed.length < 2 || trimmed.length > 100) {
          return { success: false, error: 'Full name must be between 2 and 100 characters.' };
        }
        updates.fullName = trimmed;
        await updateFirebaseProfile(auth.currentUser, { displayName: trimmed });
      }

      if (data.phoneNumber !== undefined) {
        const trimmedPhone = data.phoneNumber.trim();
        if (trimmedPhone.length > 25) {
          return { success: false, error: 'Phone number cannot exceed 25 characters.' };
        }
        updates.phoneNumber = trimmedPhone;
      }

      if (data.photoURL !== undefined) {
        const trimmedUrl = data.photoURL.trim();
        if (trimmedUrl.length > 500) {
          return { success: false, error: 'Image URL cannot exceed 500 characters.' };
        }
        updates.photoURL = trimmedUrl;
        await updateFirebaseProfile(auth.currentUser, { photoURL: trimmedUrl });
      }

      try {
        await updateDoc(userDocRef, updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
              ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber.trim() } : {}),
              ...(data.photoURL !== undefined ? { photoURL: data.photoURL.trim() } : {}),
              updatedAt: new Date().toISOString(),
            }
          : null
      );

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update profile.',
      };
    }
  };

  // Change Password Flow
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      return { success: false, error: 'Authentication required.' };
    }

    try {
      // Re-authenticate user first for security
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Apply new password
      await updateFirebasePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (err: unknown) {
      let msg = 'Failed to update password. Please check your current password.';
      if (err instanceof Error) {
        if (err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-credential')) {
          msg = 'Current password is incorrect.';
        } else if (err.message.includes('auth/weak-password')) {
          msg = 'New password is too weak.';
        } else {
          msg = err.message;
        }
      }
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authReady,
        registerUser,
        signInUser,
        signInWithGoogle,
        signOutUser,
        sendResetInstructions,
        resendVerificationEmail,
        verifyEmailWithActionCode,
        reloadCurrentUser,
        updateUserProfileData,
        changePassword,
        selectRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
