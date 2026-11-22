#include <iostream>
#include "deadlock.h"

using namespace std;

bool detectDeadlock(bool allocation[2][2], bool request[2][2], bool verbose)
{
    bool available[2] = {true, true};
    bool finish[2] = {false, false};

    // A resource is unavailable if a process currently holds it.
    for (int j = 0; j < 2; j++)
    {
        for (int i = 0; i < 2; i++)
        {
            if (allocation[i][j])
            {
                available[j] = false;
                break;
            }
        }
    }

    // Processes holding no resources can finish immediately.
    for (int i = 0; i < 2; i++)
    {
        finish[i] = !allocation[i][0] && !allocation[i][1];
    }

    // Find processes whose requested resources are available.
    bool progress = true;

    while (progress)
    {
        progress = false;

        for (int i = 0; i < 2; i++)
        {
            if (finish[i])
                continue;

            bool canFinish = true;

            for (int j = 0; j < 2; j++)
            {
                if (request[i][j] && !available[j])
                {
                    canFinish = false;
                    break;
                }
            }

            if (canFinish)
            {
                // The process finishes and releases its resources.
                for (int j = 0; j < 2; j++)
                {
                    if (allocation[i][j])
                        available[j] = true;
                }

                finish[i] = true;
                progress = true;
            }
        }
    }

    // Any unfinished process indicates a deadlock.
    for (int i = 0; i < 2; i++)
    {
        if (!finish[i])
        {
            if (verbose)
            {
                cout << "Deadlock detected!" << endl;
            }
            return true;
        }
    }

    if (verbose)
    {
        cout << "No deadlock detected." << endl;
    }
    return false;
}
