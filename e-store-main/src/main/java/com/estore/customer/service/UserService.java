package com.estore.customer.service;

import com.estore.customer.dto.UpdateProfileRequest;
import com.estore.customer.dto.UserResponse;
import com.estore.customer.entity.Profile;
import com.estore.customer.entity.User;
import com.estore.customer.mapper.UserMapper;
import com.estore.customer.repository.UserRepository;
import com.estore.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserResponse currentUser() {
        return userMapper.toResponse(loadCurrent());
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = loadCurrent();
        Profile profile = user.getProfile();
        if (profile == null) {
            profile = Profile.builder().build();
            user.attachProfile(profile);
        }
        profile.setPhone(request.phone());
        profile.setAddress(request.address());
        profile.setCity(request.city());
        profile.setCountry(request.country());
        return userMapper.toResponse(user);
    }

    private User loadCurrent() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> ResourceNotFoundException.of("User", email));
    }
}
