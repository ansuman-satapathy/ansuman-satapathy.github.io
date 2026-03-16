---
title: "Ever Wondered How Docker Actually Works Under the Hood?"
date: 2026-03-12T08:47:25+05:30
draft: false
toc: false
categories: [DevOps, Docker]
tags: [docker, containers, linux-namespaces, cgroups, ufs]
---

If you use Docker daily, the workflow becomes second nature:

```bash
docker pull
docker build
docker run
```

Containers appear, applications start, and everything “just works”.

But if you're a software engineer or working in infrastructure, treating Docker like a magical black box is not ideal. Containers are not virtual machines, and Docker isn't creating tiny computers.

Under the hood, a **container is simply a Linux process** that the kernel isolates using a few powerful features.

No hypervisor.
No guest OS.
No hardware virtualization.

Just clever use of the Linux kernel.

At the core, Docker relies on **three fundamental primitives**:

```
Namespaces  → Isolation
Cgroups     → Resource control
Union FS    → Layered filesystem
```

Once you understand these three pieces, containers stop looking like magic and start looking like **smart operating system engineering**.


<img src="scooby-doo-docker.jpeg" alt="Docker under the hood" style="width: 100%; height: auto; border-radius: 8px;">

# The Three Pillars of Containers

Think of running containers like managing tenants in an apartment building.

* **Namespaces** give each tenant their own apartment.
* **Cgroups** decide how much electricity and water they can use.
* **Union Filesystems** determine what furniture already exists in the apartment.

Docker simply coordinates these kernel features to make everything look like a small isolated system.


# 1. Namespaces

Normally every process on a Linux machine sees the same system:

* the same process tree
* the same network stack
* the same filesystem
* the same hostname

Namespaces change that.

They allow the kernel to create **separate views of system resources** for different processes.

When Docker starts a container, it creates a process with several namespaces attached to it. That process now believes it is running in its own machine.


## PID Namespace

This isolates the **process tree**.

Inside the container:

```
PID 1    nginx
PID 7    worker process
PID 8    worker process
```

On the host machine:

```
PID 4502 nginx
PID 4503 nginx worker
PID 4504 nginx worker
```

Same processes. Different view.

Inside the container, nginx believes it is **PID 1**, the first process in the system.

The host kernel knows it is just another process among thousands.


## Network Namespace

Each container receives its own network stack.

That includes:

* network interfaces
* routing tables
* firewall rules
* IP addresses

Inside the container you might see:

```
eth0   172.17.0.2
lo     127.0.0.1
```

Meanwhile the host machine has completely different interfaces.

This is why **multiple containers can run web servers on port 80 simultaneously**. Each one exists in its own networking universe.


## Mount Namespace

This isolates the filesystem.

When the container starts, Docker gives it a **different root filesystem** using `pivot_root`.

Inside the container:

```
/
├── bin
├── etc
├── usr
└── var
```

But these directories are **not the host's real filesystem**. They come from the container image.

From the container’s perspective, this *is* the entire system.


## Types of Namespaces (Quick Overview)

Linux supports several namespace types that isolate different parts of the system.

* **PID Namespace** – isolates process IDs
* **NET Namespace** – isolates networking
* **MNT Namespace** – isolates filesystem mount points
* **UTS Namespace** – isolates hostname and domain name
* **IPC Namespace** – isolates shared memory and message queues
* **USER Namespace** – isolates user IDs and permissions
* **CGROUP Namespace** – hides host cgroup hierarchy
* **TIME Namespace** – provides independent clock offsets

Containers typically use several of these together to create a fully isolated environment.


# 2. Cgroups

Isolation alone is not enough.

Imagine a container with a memory leak consuming all system RAM. Without limits, it could crash the entire host.

This is where **Control Groups (cgroups)** come in.

Cgroups allow the Linux kernel to **limit and monitor resource usage** for groups of processes.

Docker places each container inside its own cgroup.


## Memory Limits

Example:

```bash
docker run -m 512m nginx
```

This tells the kernel:

> The container cannot use more than **512MB of RAM**.

If it exceeds this limit, the kernel kills only that container, not the entire system.


## CPU Limits

Docker can also control CPU usage.

Example:

```bash
docker run --cpus=1 nginx
```

Even if the host machine has 16 cores, the container only receives the equivalent of **one CPU core worth of processing time**.


## Disk I/O Limits

Cgroups can limit disk throughput as well.

This prevents one container from becoming a **noisy neighbor** that monopolizes disk access and slows everything else down.


# 3. Union File Systems

Docker images are not single filesystems.

They are **layered filesystems**.

If five containers run from the same image, Docker does **not duplicate the entire OS five times**.

Instead, Docker uses a **Union File System**, usually **OverlayFS (overlay2)**.

Think of it like stacked transparent layers.

```
Container View
│
├── Writable Layer (UpperDir)
│
├── Image Layer 3
├── Image Layer 2
├── Image Layer 1
│
└── Base OS Layer
```

Only the **top layer is writable**.

All other layers are read-only and shared between containers.


## Copy-on-Write

If a container modifies a file from the base image:

1. The kernel copies that file into the writable layer
2. The modification happens there

This is called **Copy-on-Write (CoW)**.

It dramatically reduces disk usage and allows containers to start almost instantly.


# How These Pieces Create a Container

Let’s trace what happens when you run:

```bash
docker run nginx
```

## Step 1: Filesystem Setup (Union FS)

Docker assembles the filesystem:

```
Lower Layers  → nginx image + OS libraries
Upper Layer   → writable container layer
Merged View   → filesystem the container sees
```

To the process, it looks like a complete Linux system.


## Step 2: Isolation (Namespaces)

Docker starts a new process using the `clone()` system call with namespace flags like:

```
CLONE_NEWPID
CLONE_NEWNET
CLONE_NEWNS
CLONE_NEWUTS
```

The process now:

* thinks it is **PID 1**
* has its **own network stack**
* sees its **own filesystem**

From its perspective, it is running on its own machine.


## Step 3: Resource Limits (Cgroups)

Docker registers the process inside a cgroup.

The kernel now enforces limits such as:

```
Memory limit: 512MB
CPU limit: 1 core
```

Even if the application misbehaves, it cannot consume more resources than allowed.


## Step 4: The Application Starts

Finally, Docker launches the container's entrypoint:

```
/usr/sbin/nginx
```

The nginx process begins running.

To the process it appears as though it is the main process of a small Linux system.

In reality it is just **one isolated process running on the host kernel**.


# So in Conclusion

A container is not a machine.

It is simply:

```
A process
+ isolation (Namespaces)
+ resource limits (Cgroups)
+ a layered filesystem (Union FS)
```

Docker doesn’t invent new virtualization technology.

It simply orchestrates existing Linux kernel primitives to make application environments **portable, isolated, and lightweight**.

Once you understand that, containers stop looking like magic and start looking like **clever operating system design**.

