  const handleDelete = async () => {
    setBusy(true);
    hapticWarning();
    try {
      await deleteAccount();
      queryClient.clear();
      signOut();
      router.replace('/auth/sign-in');
    } catch (err: any) {
      setBusy(false);
      console.error('Delete account error:', err);
      // Show error in UI
      alert(err?.message || 'Failed to delete account. Please try again.');
    }
  };