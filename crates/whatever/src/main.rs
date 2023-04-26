use clap::Parser;
use commands::{Cli, Commands};

mod commands;

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Init => {
            commands::init::run();
        }
    }

    // look for default config or passed config path

    // load config
    // if it has a workspace config split the work per workspace
    // run linter instance
}
