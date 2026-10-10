#include <iostream>
#include "deadlock.h"

using namespace std;

bool detectDeadlock(bool allocation[2][2], bool request[2][2])
{
    bool waiting[2] = {false, false};

    for (int i = 0; i < 2; i++)
    {
        for (int j = 0; j < 2; j++)
        {
            if (request[i][j] == true)
            {
                waiting[i] = true;
            }
        }
    }

    if (waiting[0] && waiting[1])
    {
        cout << "Possible deadlock detected." << endl;
        return true;
    }

    cout << "No deadlock detected." << endl;
    return false;
}