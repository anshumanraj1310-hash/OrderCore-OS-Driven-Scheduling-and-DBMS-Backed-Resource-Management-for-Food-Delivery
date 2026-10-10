#include <iostream>
#include "synchronization.h"
#include "deadlock.h"

using namespace std;

int main()
{
    cout << "===== Synchronization Test =====\n\n";

    processOrder(1);
    processOrder(2);

    cout << "\n===== Deadlock Test =====\n\n";

    bool allocation[2][2] =
    {
        {true, false},
        {false, true}
    };

    bool request[2][2] =
    {
        {false, true},
        {true, false}
    };

    detectDeadlock(allocation, request);

    return 0;
}