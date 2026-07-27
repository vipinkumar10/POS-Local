package com.poslocal.repository;

import com.poslocal.model.SyncedRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SyncedRecipeRepository extends JpaRepository<SyncedRecipe, String> {
}
