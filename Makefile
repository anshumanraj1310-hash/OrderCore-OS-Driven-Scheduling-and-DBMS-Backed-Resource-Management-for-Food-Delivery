CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2

# Targets
all: scheduler deadlock os_test resource_test

scheduler: scheduler/scheduler_test

scheduler/scheduler_test: scheduler/scheduler.cpp scheduler/fcfs.cpp scheduler/sjf.cpp scheduler/priority.cpp
	$(CXX) $(CXXFLAGS) -I scheduler $^ -o $@

deadlock: deadlock/deadlock_runner

deadlock/deadlock_runner: deadlock/deadlock_runner.cpp deadlock/deadlock.cpp
	$(CXX) $(CXXFLAGS) -I deadlock $^ -o $@

os_test: tests/os_test.cpp synchronization/synchronization.cpp deadlock/deadlock.cpp
	$(CXX) $(CXXFLAGS) -I synchronization -I deadlock $^ -o $@

resource_test: resource_management/resource_test.cpp resource_management/resource_manager.cpp resource_management/agent.cpp
	$(CXX) $(CXXFLAGS) -I resource_management $^ -o $@

test: all
	@echo "=== Running OS Test ==="
	@./os_test
	@echo "\n=== Running Resource Test ==="
	@./resource_test
	@echo "\n=== Running Deadlock Runner ==="
	@./deadlock/deadlock_runner simulate
	@echo "\n=== Running Scheduler Test (FCFS) ==="
	@printf "2\n1 0 4 1\n2 1 2 2\n" | ./scheduler/scheduler_test FCFS
	@echo "\n=== All Tests Passed Successfully ==="

clean:
	rm -f os_test resource_test scheduler_test scheduler/scheduler scheduler/scheduler_test deadlock/deadlock_runner
	rm -rf *.dSYM scheduler/*.dSYM deadlock/*.dSYM resource_management/*.dSYM

.PHONY: all scheduler deadlock test clean
