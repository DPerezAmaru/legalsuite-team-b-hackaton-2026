package com.expedientia.config;

import com.expedientia.entity.Usuario;
import com.expedientia.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedDefaultUser(UsuarioRepository repo) {
        return args -> {
            if (repo.findByEmail("demo@expedientia.com").isEmpty()) {
                Usuario u = new Usuario();
                u.setNombre("Usuario Demo");
                u.setEmail("demo@expedientia.com");
                u.setRol(Usuario.Rol.ABOGADO);
                repo.save(u);
            }
        };
    }
}
