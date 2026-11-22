#include <iostream>
#include <string>
#include <vector>
#include "deadlock.h"

using namespace std;

void printJson(bool isDeadlocked,
               const string& explanation,
               const string& resolution,
               bool alloc[2][2],
               bool req[2][2])
{
    cout << "{\n";
    cout << "  \"deadlock\": " << (isDeadlocked ? "true" : "false") << ",\n";
    cout << "  \"explanation\": \"" << explanation << "\",\n";
    cout << "  \"resolution\": \"" << resolution << "\",\n";
    cout << "  \"allocation\": [[" << alloc[0][0] << "," << alloc[0][1] << "],[" << alloc[1][0] << "," << alloc[1][1] << "]],\n";
    cout << "  \"request\": [[" << req[0][0] << "," << req[0][1] << "],[" << req[1][0] << "," << req[1][1] << "]],\n";
    cout << "  \"processes\": [\"Order 1 (Process P0)\", \"Order 2 (Process P1)\"],\n";
    cout << "  \"resources\": [\"Kitchen Prep Slot (R0)\", \"Delivery Agent (R1)\"]\n";
    cout << "}\n";
}

int main(int argc, char* argv[])
{
    string mode = "simulate";
    if (argc > 1)
    {
        mode = argv[1];
    }

    if (mode == "resolve")
    {
        // Resolved state: Break circular wait by preemption.
        // Process P0 holds Kitchen Slot (R0) and requests Delivery Agent (R1).
        // Process P1 releases Delivery Agent (R1) so P0 can finish first, then P1 runs.
        bool alloc[2][2] = {
            {true, false},  // P0 holds R0
            {false, false}  // P1 released R1 (preempted/queued)
        };
        bool req[2][2] = {
            {false, true},  // P0 requests R1
            {true, false}   // P1 requests R0
        };

        bool deadlocked = detectDeadlock(alloc, req, false);
        printJson(deadlocked,
                  "Deadlock avoided. Agent R1 preempted/allocated sequentially. Order 1 finishes first, freeing the kitchen slot for Order 2.",
                  "Enforced strict resource ordering: Kitchen Prep Slot must be acquired and completed before Delivery Agent dispatch.",
                  alloc, req);
        return 0;
    }

    if (mode == "detect" && argc >= 10)
    {
        // Custom matrix from CLI: a00 a01 a10 a11 r00 r01 r10 r11
        bool alloc[2][2];
        bool req[2][2];

        alloc[0][0] = (stoi(argv[2]) != 0);
        alloc[0][1] = (stoi(argv[3]) != 0);
        alloc[1][0] = (stoi(argv[4]) != 0);
        alloc[1][1] = (stoi(argv[5]) != 0);

        req[0][0] = (stoi(argv[6]) != 0);
        req[0][1] = (stoi(argv[7]) != 0);
        req[1][0] = (stoi(argv[8]) != 0);
        req[1][1] = (stoi(argv[9]) != 0);

        bool deadlocked = detectDeadlock(alloc, req, false);
        string exp = deadlocked ? "Circular wait detected between processes." : "All processes can finish. No deadlock.";
        string res = deadlocked ? "Preempt one held resource or break the request cycle." : "System is in a safe state.";

        printJson(deadlocked, exp, res, alloc, req);
        return 0;
    }

    // Default: Simulate classic Food Delivery Deadlock
    // P0 (Order 1) holds Kitchen Slot (R0), requests Delivery Agent (R1)
    // P1 (Order 2) holds Delivery Agent (R1), requests Kitchen Slot (R0)
    bool alloc[2][2] = {
        {true, false},
        {false, true}
    };
    bool req[2][2] = {
        {false, true},
        {true, false}
    };

    bool deadlocked = detectDeadlock(alloc, req, false);
    printJson(deadlocked,
              "Deadlock detected! Order 1 holds Kitchen Slot while waiting for Delivery Agent. Order 2 holds Delivery Agent while waiting for Kitchen Slot.",
              "Resolution requires preemption: release the Delivery Agent from Order 2 so Order 1 can complete.",
              alloc, req);

    return 0;
}
