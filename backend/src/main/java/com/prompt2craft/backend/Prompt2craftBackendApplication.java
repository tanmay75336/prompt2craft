package com.prompt2craft.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class Prompt2craftBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(Prompt2craftBackendApplication.class, args);
    }

}
