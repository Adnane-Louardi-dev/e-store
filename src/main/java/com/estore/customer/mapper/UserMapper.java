package com.estore.customer.mapper;

import com.estore.customer.dto.ProfileResponse;
import com.estore.customer.dto.UserResponse;
import com.estore.customer.entity.Profile;
import com.estore.customer.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                toResponse(user.getProfile())
        );
    }

    public ProfileResponse toResponse(Profile profile) {
        if (profile == null) {
            return null;
        }
        return new ProfileResponse(
                profile.getId(),
                profile.getPhone(),
                profile.getAddress(),
                profile.getCity(),
                profile.getCountry()
        );
    }
}
