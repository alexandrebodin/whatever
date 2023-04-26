use clap::{Parser, Subcommand};

pub mod init;

#[derive(Parser)]
#[clap(name = "Whatever", version, propagate_version = true)]
pub struct Cli {
    #[clap(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    Init,
}
