package com.expedientia.config;

import com.expedientia.entity.Usuario;
import com.expedientia.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedUsuarios(UsuarioRepository repo) {
        return args -> {
            List<Object[]> usuarios = List.of(
                new Object[]{"Andrés Felipe Restrepo Montoya",  "a.restrepo@castilloabogados.com.co",   Usuario.Rol.ADMIN},
                new Object[]{"Marcela Jiménez Salazar",         "m.jimenez@castilloabogados.com.co",    Usuario.Rol.ADMIN},
                new Object[]{"Carlos Eduardo Mora Herrera",     "c.mora@castilloabogados.com.co",       Usuario.Rol.ABOGADO},
                new Object[]{"Daniela Ospina Cardona",          "d.ospina@castilloabogados.com.co",     Usuario.Rol.ABOGADO},
                new Object[]{"Sebastián Vargas Ríos",           "s.vargas@castilloabogados.com.co",     Usuario.Rol.ABOGADO},
                new Object[]{"Valentina Cárdenas Patiño",       "v.cardenas@castilloabogados.com.co",   Usuario.Rol.ABOGADO},
                new Object[]{"Juan Pablo Gutiérrez Arango",     "jp.gutierrez@castilloabogados.com.co", Usuario.Rol.ABOGADO},
                new Object[]{"Laura Sofía Bermúdez Torres",     "l.bermudez@castilloabogados.com.co",   Usuario.Rol.ASISTENTE},
                new Object[]{"Miguel Ángel Suárez Peña",        "m.suarez@castilloabogados.com.co",     Usuario.Rol.ASISTENTE},
                new Object[]{"Camila Andrea Rincón Díaz",       "c.rincon@castilloabogados.com.co",     Usuario.Rol.ASISTENTE}
            );

            for (Object[] u : usuarios) {
                String email = (String) u[1];
                if (repo.findByEmail(email).isEmpty()) {
                    Usuario usuario = new Usuario();
                    usuario.setNombre((String) u[0]);
                    usuario.setEmail(email);
                    usuario.setRol((Usuario.Rol) u[2]);
                    repo.save(usuario);
                }
            }
        };
    }
}
