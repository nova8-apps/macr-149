  const handleSignOut = async () => {
    hapticWarning();
    try {
      await logout();
    } catch (err) {
      console.warn('[signOut] logout call failed:', err);
    }
    queryClient.clear();
    signOut();
    router.replace('/auth/sign-in');
  };