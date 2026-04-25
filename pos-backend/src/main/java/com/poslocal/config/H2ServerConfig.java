package com.poslocal.config;

import org.h2.tools.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.sql.SQLException;

@Configuration
public class H2ServerConfig {

    /**
     * Start the H2 TCP Server so external tools (DBeaver, Shell) can connect.
     * Default port is 9092.
     */
    @Bean(initMethod = "start", destroyMethod = "stop")
    public Server h2TcpServer() throws SQLException {
        return Server.createTcpServer("-tcp", "-tcpAllowOthers", "-ifNotExists");
    }

    /**
     * Start the H2 Web Server (Console) on a separate port if needed,
     * though Spring Boot already provides one at /h2-console on the main web port.
     */
}
