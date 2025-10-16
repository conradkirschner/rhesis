import { useMutation } from '@tanstack/react-query';
import {
  createOrganizationOrganizationsPostMutation,
  updateUserUsersUserIdPutMutation,
  createUserUsersPostMutation,
  initializeOrganizationDataOrganizationsOrganizationIdLoadInitialDataPostMutation,
} from '@/api-client/@tanstack/react-query.gen';

type CompleteOnboardingInput = {
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly organizationName: string;
  readonly website?: string;
  readonly invites: readonly string[];
};

type CompleteOnboardingResult = {
  readonly organizationId: string;
  readonly sessionToken?: string;
};

export function useOnboardingData() {
  const createOrganization = useMutation(createOrganizationOrganizationsPostMutation());
  const updateUser = useMutation(updateUserUsersUserIdPutMutation());
  const createUser = useMutation(createUserUsersPostMutation());
  const initializeOrg = useMutation(
    initializeOrganizationDataOrganizationsOrganizationIdLoadInitialDataPostMutation(),
  );

  async function completeOnboarding(input: CompleteOnboardingInput): Promise<CompleteOnboardingResult> {
    const { userId, firstName, lastName, organizationName, website, invites } = input;

    const organization = await createOrganization.mutateAsync({
      body: {
        name: organizationName,
        website: website || undefined,
        owner_id: userId,
        user_id: userId,
        is_active: true,
        is_domain_verified: false,
      },
    });

    const updateRes = await updateUser.mutateAsync({
      path: { user_id: userId },
      body: {
        given_name: firstName,
        family_name: lastName,
        name: `${firstName} ${lastName}`,
        organization_id: organization.id,
      },
    });

    const filteredInvites = invites
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (filteredInvites.length > 0) {
      await Promise.allSettled(
        filteredInvites.map((email) =>
          createUser.mutateAsync({
            body: {
              email,
              organization_id: organization.id,
              is_active: true,
              send_invite: true,
            },
          }),
        ),
      );
    }

    const initRes = await initializeOrg.mutateAsync({
      path: { organization_id: String(organization.id) },
    });

    if (initRes.status !== 'success') {
      throw new Error('Failed to initialize organization data');
    }

    return {
      organizationId: String(organization.id),
      sessionToken: updateRes.session_token ?? undefined,
    };
  }

  return {
    completeOnboarding,
    isPending:
      createOrganization.isPending ||
      updateUser.isPending ||
      createUser.isPending ||
      initializeOrg.isPending,
  };
}