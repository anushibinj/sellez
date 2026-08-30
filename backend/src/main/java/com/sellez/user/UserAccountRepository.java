package com.sellez.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    @Query("select u from UserAccount u join fetch u.community where lower(u.email) = lower(:email)")
    Optional<UserAccount> findByEmailIgnoreCase(@Param("email") String email);

    @Query("select u from UserAccount u join fetch u.community where u.id = :id")
    Optional<UserAccount> findWithCommunityById(@Param("id") UUID id);

    List<UserAccount> findByCommunityIdAndRole(UUID communityId, UserRole role);

    @Query("select u from UserAccount u join fetch u.community where u.community.id = :communityId order by u.createdAt desc")
    List<UserAccount> findByCommunityId(@Param("communityId") UUID communityId);
}
