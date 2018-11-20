# Concurrency Modes (4 min)

Setup: In terminal:

`cd  ~/src/antares-demo`

Adjust font size, screen:

`asciinema play ConcurrencyModesPausable.cast`

(Immediately clear screen so `$bash` is top line).


# Demo Overview

# Interactive - Parallel

We'll download a strawberry and an Avocado for comparison purposes
Now, while we're downloading an Avocado..

But when you'd be overwhelmed by trying to serve each one concurrently, there is the 'serial' mode 

# Interactive - Serial

We'll download a strawberry and an Avocado for comparison purposes
Now, while we're downloading an Avocado..

In both of these modes, every download that we start will eventually complete.

But other times, we want to save system resources. Or what if we don't want to ADD to the system's workload - merely **replace** the existing workload? Let's take a look at the agent's *lossy* modes, where work might not finish, or won't even start.

# Interactive - Cutoff

We'll download a strawberry and an Avocado for comparison purposes
Now, while we're downloading an Avocado..

Where'd the Avocados go?
How many checkboxes now?

This is useful for example, for an autocomplete, where you always want to cutoff the old autocomplete results when you've typed new characters [visual].

For the last mode - have you seen anyone mashing the buttons on an elevator, trying to make it come faster? For them you may want to introduce 'mute' mode.

# Interactive - Mute

We'll download a strawberry and an Avocado for comparison purposes
Now, while we're downloading an Avocado..

Nuh uh strawberry, we're busy!

Mute is useful when you want to force your users to wait for the completion of what's in progress before taking new actions from them. It's the simplest form of throttling, and can easily be customized to more complex scenarios by including an additional delay before the renderer completes [visual].

