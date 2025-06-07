import { supabase } from '@/lib/supabase';
import { checkBothAvailability } from './users';


export async function signUpWithEmail(
  email: string, 
  password: string, 
  first_name: string, 
  last_name: string, 
  username: string, 
  phone_number: string
) {
  try {
    // First, check if email and username are available
    const availabilityCheck = await checkBothAvailability(email, username);
    
    if (!availabilityCheck.bothAvailable) {
      const errors = [];
      if (!availabilityCheck.email.available) {
        errors.push(availabilityCheck.email.message);
      }
      if (!availabilityCheck.username.available) {
        errors.push(availabilityCheck.username.message);
      }
      
      return {
        success: false,
        message: errors.join(' and '),
      };
    }

    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(), // Normalize email
      password,
      options: {
        data: {
          first_name,
          last_name,
          username: username.toLowerCase(), // Normalize username
          phone_number,
        },
      },
    });

    if (error) {
      console.error('Error signing up:', error.message);
      
      // Handle specific Supabase Auth errors
      if (error.message.includes('already registered')) {
        return {
          success: false,
          message: 'This email is already registered.',
        };
      }
      
      return {
        success: false,
        message: error.message,
      };
    }

    // Check if user was created successfully
    if (data && data.user) {
      // For email confirmation flow
      if (data.user.identities && data.user.identities.length === 0) {
        return {
          success: false,
          message: 'This email is already registered.',
        };
      }

      // Insert user data into the "users" table with error handling
      const { error: dbError } = await supabase.from("users").insert({
        email: email.toLowerCase(),
        user_id: data.user.id,
        username: username.toLowerCase(),
        first_name,
        last_name,
        phone_number,
        points: 0, // Initialize with 0 points
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error("Database Insert Error:", dbError.message);
        
        // If database insert fails, we should clean up the auth user
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          console.error("Failed to cleanup auth user:", cleanupError);
        }
        
        // Handle specific database errors
        if (dbError.code === '23505') { // Unique constraint violation
          if (dbError.message.includes('username')) {
            return {
              success: false,
              message: "Username is already taken.",
            };
          }
          if (dbError.message.includes('email')) {
            return {
              success: false,
              message: "Email is already registered.",
            };
          }
        }
        
        return {
          success: false,
          message: "Sign-up failed. Please try again.",
        };
      }

      // Create initial user preferences
      const { error: prefsError } = await supabase.from("user_preferences").insert({
        user_id: data.user.id,
        notifications_enabled: true,
        favorite_teams: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (prefsError) {
        console.warn("Failed to create user preferences:", prefsError.message);
        // Don't fail the signup for this, just log it
      }

      // If email confirmation is enabled in Supabase
      if (data.session === null) {
        return {
          success: true,
          message: 'Check your email for the confirmation link.',
        };
      }

      // If email confirmation is disabled, user is signed in immediately
      return {
        success: true,
        message: 'Account created successfully!',
        user: data.user,
      };
    }

    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    };
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    return {
      success: false,
      message: 'An unexpected error occurred.',
    };
  }
}


/**
 * Sign in a user with email and password
 * @param email User's email
 * @param password User's password
 * @returns Object with success status and message
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return {
      success: false,
      message: 'An unexpected error occurred.',
    };
  }
}

/**
 * Sign out the current user
 * @returns Object with success status and message
 */
export async function signOut() {
  try {
    // Remove the useRouter hook from here
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
    
    return {
      success: true,
      message: 'Signed out successfully',
    };
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return {
      success: false,
      message: 'An unexpected error occurred.',
    };
  }
}

/**
 * Get the current user session
 * @returns The current session or null
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return null;
  }
}

/**
 * Get the current user
 * @returns The current user or null
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error.message);
      return null;
    }
    return data.user.user_metadata;
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return null;
  }
}


export async function signInWithEmailOrUsername(identifier: string, password: string) {
  try {
    // Check if the identifier is an email (contains @ symbol)
    const isEmail = identifier.includes("@")

    if (isEmail) {
      // If it's an email, use the standard signInWithPassword
      return await signInWithEmail(identifier, password)
    } else {
      // If it's a username, we need to:
      // 1. Query the users table to find the email associated with this username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("username", identifier)
        .single()

      if (userError || !userData) {
        console.error("Error finding user by username:", userError?.message)
        return {
          success: false,
          message: "Username not found",
        }
      }

      // 2. Use the email to sign in
      return await signInWithEmail(userData.email, password)
    }
  } catch (error) {
    console.error("Unexpected error during sign in:", error)
    return {
      success: false,
      message: "An unexpected error occurred.",
    }
  }
}

/**
 * Create or update a user profile in the profiles table
 * @param userId The user's ID
 * @param profileData The profile data to save
 * @returns Object with success status and message
 */
export async function upsertProfile(userId: string, profileData: {
  username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  full_name?: string;
  avatar_url?: string;
}) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        updated_at: new Date().toISOString(),
        ...profileData,
      });

    if (error) {
      console.error('Error updating profile:', error.message);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return {
      success: false,
      message: 'An unexpected error occurred.',
    };
  }
}

/**
 * Get a user's profile from the profiles table
 * @param userId The user's ID
 * @returns The user's profile or null
 */
export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return null;
  }
}
