package com.estore.customer.mapper;

import com.estore.customer.dto.ProfileResponse;
import com.estore.customer.dto.UserResponse;
import com.estore.customer.entity.Profile;
import com.estore.customer.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "profile", source = "profile")
    UserResponse toResponse(User user);

    ProfileResponse toResponse(Profile profile);
}
